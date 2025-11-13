import { insertValues } from "../sql.js";
import { db, type User } from "./db.js";

const result = await db.query<User>`
  INSERT INTO users ${insertValues(["name", "email"], {
    name: "John",
    email: "john@acmebiz.xyz",
  })} 
  RETURNING *
`;

console.log(result);
