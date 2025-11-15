import { pgist } from "./db.ts";

export const databaseUrl =
  "postgres://postgres:postgres@127.0.0.1:5432/pgist-test";

export function testDB() {
  return pgist({
    db: {
      connectionString: databaseUrl,
      allowExitOnIdle: true,
      connectionTimeoutMillis: 3000,
      application_name: "pgist-test",
    },
  });
}
