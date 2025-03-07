import assert from "node:assert";
import { describe, it } from "node:test";
import { createMigrationsTable } from "./migrate.js";
import { testDB } from "./test-help";

const db = testDB();

describe("migrations", () => {
  describe("createMigrationsTable", () => {
    it("creates a migrations table", async () => {
      await db.query`DROP TABLE IF EXISTS migrations`;

      await createMigrationsTable(db);

      const result = await db.one<{
        count: number;
      }>`SELECT count(id)::int FROM migrations`;
      assert.ok(result !== undefined);
      assert.equal(result.count, 0);
    });
  });
});
