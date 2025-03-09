import type { Queryable } from "../../db.js";

export default async function up(db: Queryable) {
  await db.query`CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      org_id INTEGER REFERENCES orgs(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL
    )`;
}
