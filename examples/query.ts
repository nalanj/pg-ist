import { type User, db } from "./db.js";

const id = 5;
const result = await db.query<User>`SELECT * FROM users WHERE id = ${id}`;

console.log(result.length);

for (const row of result) {
	console.log(row.name);
}
