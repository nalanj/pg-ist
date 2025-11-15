import { updateValues } from "../sql.ts";
import { db, type User } from "./db.ts";

const result = await db.query<User>`
  UPDATE users SET ${updateValues(["name", "email"], {
    name: "John",
    email: "john@acmebiz.xyz",
  })}
  WHERE id = 1
  RETURNING *
`;

console.log(result);
