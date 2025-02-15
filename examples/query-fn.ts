import { type User, db } from "./db.js";

db.queryFn<User, { id: string }>`SELECT * FROM users WHERE id = ${"id"}`;
