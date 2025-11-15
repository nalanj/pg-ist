import { insertValues } from "../sql.ts";
import { db, type User } from "./db.ts";

const result = await db.query<User>`
  INSERT INTO users ${insertValues(["name", "email"], {
    name: "John",
    email: "john@acmebiz.xyz",
  })} 
  RETURNING *
`;

console.log(result);
