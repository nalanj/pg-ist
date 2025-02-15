import { type User, db } from "./db.js";

const id = 5;
const result = await db.one<User>`SELECT * FROM users WHERE id = ${id}`;

if (result !== undefined) {
	console.log(result.name);
}
