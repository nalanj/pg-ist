import { insertValues } from "../sql.js";
import { type User, db } from "./db.js";

const result = await db.query<User>`
  INSERT INTO users ${insertValues(["name", "email"], {
    name: "John",
    email: "john@acmebiz.xyz",
  })} 
  RETURNING *
`;
