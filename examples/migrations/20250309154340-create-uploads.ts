import type { Queryable } from "../../db.js";

export default async function up(db: Queryable) {
  await db.query`CREATE TABLE uploads (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    )`;
}
