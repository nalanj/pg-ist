import type { Queryable } from "./db.js";

export type MigrationRow = {
  id: string;
  createdAt: Date;
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
