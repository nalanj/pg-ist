import type { Queryable } from "../../db.js";

export default async function up(db: Queryable) {
  await db.query`
    CREATE TABLE IF NOT EXISTS orgs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
}
