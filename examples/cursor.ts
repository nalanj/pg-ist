import { db, type User } from "./db.ts";

const cursor = db.cursor(100);
for await (const row of cursor<User>`SELECT * FROM users`) {
  console.log(row);
}
