import { sql } from "pg-ist";

const id = 5;
const select = sql`SELECT * FROM users WHERE id = ${id}`;

const limit = 10;
const limited = sql`${select} LIMIT ${limit}`;
