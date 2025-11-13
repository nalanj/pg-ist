import { db, type User } from "./db.js";

const id = 1;
const result = await db.one<User>`SELECT * FROM users WHERE id = ${id}`;

if (result !== undefined) {
  console.log(result.name);
}

db.end();
