import { type User, db } from "./db.js";

const cursor = db.cursor(100);
for await (const row of await cursor<User>`SELECT * FROM users`) {
	console.log(row);
}
