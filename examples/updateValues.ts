import { updateValues } from "../sql.js";
import { type User, db } from "./db.js";

const result = await db.query<User>`
  UPDATE users SET ${updateValues(["name", "email"], {
    name: "John",
    email: "john@acmebiz.xyz",
  })}
  WHERE id = 1
  RETURNING *
`;
