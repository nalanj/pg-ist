import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import { beforeEach, describe, it } from "node:test";
import {
  type MigrationRow,
  availableMigrations,
  createMigration,
  createMigrationsTable,
  latestMigration,
  migrationRegex,
  pendingMigrations,
} from "./migrate.js";
import { testDB } from "./test-help";

const db = testDB();

const basicMigrations = [
  {
    path: path.join(
      process.cwd(),
      "fixtures/migrations/basic/20241231011345-create-orgs.js",
    ),
    id: "20241231011345",
  },
  {
    path: path.join(
      process.cwd(),
      "fixtures/migrations/basic/20250302090823-create-docs.js",
    ),
    id: "20250302090823",
  },
  {
    path: path.join(
      process.cwd(),
      "fixtures/migrations/basic/20250307212006-create-users.js",
    ),
    id: "20250307212006",
  },
];

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

  describe("availableMigrations", () => {
    it("gets available migrations", async () => {
      const migrations = await availableMigrations(
        "./fixtures/migrations/basic/",
      );

      assert.equal(migrations.length, 3);
      assert.deepEqual(migrations, basicMigrations);
    });
  });

  describe("pendingMigrations", () => {
    it("gets pending migrations", async () => {
      await createMigrationsTable(db);
      await db.query`INSERT INTO migrations (id) VALUES ('20241231011345')`;

      const migrations = await availableMigrations(
        "./fixtures/migrations/basic/",
      );

      assert.equal(migrations.length, 3);

      const latest = await latestMigration(db);
      assert.ok(latest !== undefined);

      const pending = pendingMigrations(migrations, latest);
      assert.equal(pending.length, 2);
      assert.deepEqual(pending, [basicMigrations[1], basicMigrations[2]]);
    });
  });

  describe("createMigration", () => {
    it("creates a migration", async () => {
      const filename = await createMigration("./tmp", "create-works");

      assert.ok(filename !== undefined);
      const base = path.basename(filename);
      assert.ok(migrationRegex.test(base));
      assert.ok(base.endsWith("create-works.js"));

      const stat = await fs.stat(filename);
      assert.ok(stat.isFile());
      await fs.rm(filename);
    });

    it("returns undefined if migration already exists", async (t) => {
      t.mock.timers.enable({ apis: ["Date"] });
      const filename = await createMigration("./tmp", "colission");
      assert.ok(filename !== undefined);

      assert.equal(await createMigration("./tmp", "colission"), undefined);

      await fs.rm(filename);
    });
  });
});
