import { type User, db } from "./db.js";

const id = 5;
const result = await db.onlyOne<User>`SELECT * FROM users WHERE id = ${id}`;
console.log(result.name);
