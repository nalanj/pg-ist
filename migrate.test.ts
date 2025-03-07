import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import {
  type MigrationRow,
  createMigrationsTable,
  latestMigration,
} from "./migrate.js";
import { testDB } from "./test-help";

const db = testDB();

describe("migrations", () => {
  beforeEach(async () => {
    await db.query`DROP TABLE IF EXISTS migrations`;
  });

  describe("createMigrationsTable", () => {
    it("creates a migrations table", async () => {
      await createMigrationsTable(db);

      const result = await db.one<{
        count: number;
      }>`SELECT count(id)::int FROM migrations`;
      assert.ok(result !== undefined);
      assert.equal(result.count, 0);
    });
  });

  describe("insertMigration", () => {
    it("inserts a migration", async () => {
      await createMigrationsTable(db);

      await db.query`INSERT INTO migrations (id) VALUES ('a')`;

      const result =
        await db.one<MigrationRow>`SELECT * FROM migrations WHERE id = 'a'`;
      assert.ok(result !== undefined);
      assert.equal(result.id, "a");
    });
  });

  describe("latestMigration", () => {
    it("gets latest MigrationRow", async () => {
      await createMigrationsTable(db);

      await db.query`INSERT INTO migrations (id) VALUES ('a'), ('b'), ('c')`;

      const result = await latestMigration(db);
      assert.ok(result !== undefined);
      assert.equal(result.id, "c");
    });
  });
});
