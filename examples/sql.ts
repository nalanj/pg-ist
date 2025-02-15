import { sql } from "pg-ist";

const id = 5;
const select = sql`SELECT * FROM users WHERE id = ${id}`;
