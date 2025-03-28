import fs from "node:fs/promises";
import path from "node:path";
import type { Queryable } from "./db.js";

export type MigrationRow = {
  id: string;
  createdAt: Date;
};

export type MigrationPath = {
  path: string;
  id: string;
};

export const migrateLockId = 8_637_929_284_372_155;
export const migrationRegex = /^(\d{14})-(.*)\.[cm]?[tj]s$/;

export async function createMigrationsTable(db: Queryable) {
  await db.query`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT NOT NULL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function insertMigration(db: Queryable, id: string) {
  await db.query`INSERT INTO migrations (id) VALUES (${id})`;
}

export async function latestMigration(db: Queryable) {
  try {
    return await db.one<MigrationRow>`
    SELECT * FROM migrations ORDER BY id DESC LIMIT 1
  `;
  } catch {
    return undefined;
  }
}

export async function availableMigrations(
  migrationPath: string,
): Promise<MigrationPath[]> {
  const fileNames = await fs.readdir(migrationPath);

  return fileNames
    .flatMap<MigrationPath>((filename) => {
      const match = filename.match(migrationRegex);

      if (!match) {
        return [];
      }

      return {
        path: path.resolve(process.cwd(), path.join(migrationPath, filename)),
        id: match[1] as string,
      };
    })
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function pendingMigrations(
  available: MigrationPath[],
  latest?: MigrationRow,
): MigrationPath[] {
  if (!latest) {
    return available;
  }

  const firstNotRun = available.findIndex(
    (migration) => migration.id > latest.id,
  );

  if (firstNotRun === -1) {
    return [];
  }

  return available.slice(firstNotRun);
}

function migrationDate() {
  const date = new Date();
  return date.toISOString().replace(/[-:T]/g, "").split(".")[0];
}

export async function createMigration(
  migrationPath: string,
  name: string,
  typescript = false,
): Promise<string | undefined> {
  const filename = path.join(
    migrationPath,
    `${migrationDate()}-${name}.${typescript ? "ts" : "js"}`,
  );

  try {
    const stat = await fs.stat(filename);
    if (stat) {
      return;
    }
  } catch {
    // file isn't there yet
  }

  // we don't generate anything in the file
  const content = typescript
    ? 'import { type Queryable } from "@nalanj/pg-ist";\n\nexport default async function up(db: Queryable) {}'
    : "export default async function up(db) {}";

  await fs.writeFile(filename, content);

  return filename;
}

export async function lockMigrations(db: Queryable) {
  const lock = await db.onlyOne<{
    locked: boolean;
  }>`SELECT pg_try_advisory_lock(${migrateLockId}) AS locked`;
  if (!lock.locked) {
    throw new Error("Unable to acquire migration lock");
  }
}

export async function unlockMigrations(db: Queryable) {
  const unlock = await db.onlyOne<{
    unlocked: boolean;
  }>`SELECT pg_advisory_unlock(${migrateLockId}) as unlocked`;
  if (!unlock.unlocked) {
    throw new Error("Unable to release migration lock");
  }
}

export async function runMigration(db: Queryable, migration: MigrationPath) {
  const migrationModule = await import(migration.path);
  if (!migrationModule.default) {
    throw new Error(
      `The migration defined at ${migration.path} has no default export`,
    );
  }

  await lockMigrations(db);
  await createMigrationsTable(db);
  const latest = await latestMigration(db);

  // just a final check to ensure we're not doing something really bad here
  // by running a migration that has already been run
  if (latest && latest.id >= migration.id) {
    throw new Error(`Migration ${migration.id} already run`);
  }

  await migrationModule.default(db);

  await insertMigration(db, migration.id);
  await unlockMigrations(db);
}
