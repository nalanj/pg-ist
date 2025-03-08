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
  return await db.one<MigrationRow>`
    SELECT * FROM migrations ORDER BY id DESC LIMIT 1
  `;
}

const migrationRegex = /^(\d{14})-(.*)\.js$/;
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

  if (!firstNotRun) {
    return [];
  }

  return available.slice(firstNotRun);
}
