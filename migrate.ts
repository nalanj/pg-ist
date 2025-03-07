import type { Queryable } from "./db.js";

export async function createMigrationsTable(db: Queryable) {
  await db.query`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT NOT NULL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
