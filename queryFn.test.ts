import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { oneFn, onlyOneFn, queryFn } from "./queryFn.js";
import { testDB } from "./test-help.js";

const db = testDB();

type QueryFnTesting = {
  id: number;
  name: string;
};

before(async () => {
  await db.query`CREATE TABLE IF NOT EXISTS queryfn_testing (id SERIAL NOT NULL, name TEXT NOT NULL)`;
});

after(async () => {
  await db.query`DELETE FROM queryfn_testing`;
  db.end();
});

describe("queryFn", () => {
  it("defines a query function", async () => {
    const find = queryFn<
      QueryFnTesting,
      { id: number }
    >`SELECT * FROM queryfn_testing WHERE id = ${"id"}`;

    const inserted =
      await db.onlyOne<QueryFnTesting>`INSERT INTO queryfn_testing(name) VALUES (${"Jimmy"}) RETURNING *`;

    const found = await find({ id: inserted.id }, db);

    assert.equal(found.length, 1);
    const rows = Array.from(found);
    assert.equal(rows[0].id, inserted.id);
    assert.equal(rows[0].name, inserted.name);
  });
});

describe("oneFn", () => {
  it("defines a one function", async () => {
    const one = oneFn<
      QueryFnTesting,
      { id: number }
    >`SELECT * FROM queryfn_testing WHERE id = ${"id"}`;

    const inserted =
      await db.onlyOne<QueryFnTesting>`INSERT INTO queryfn_testing(name) VALUES (${"Jimmy"}) RETURNING *`;

    const found = await one({ id: inserted.id }, db);

    assert.ok(found !== undefined);
    assert.equal(found.id, inserted.id);
    assert.equal(found.name, inserted.name);
  });
});

describe("onlyOneFn", () => {
  const onlyOne = onlyOneFn<
    QueryFnTesting,
    { id: number }
  >`SELECT * FROM queryfn_testing WHERE id = ${"id"}`;

  it("defines an onlyOne function", async () => {
    const inserted =
      await db.onlyOne<QueryFnTesting>`INSERT INTO queryfn_testing(name) VALUES (${"Jimmy"}) RETURNING *`;

    const found = await onlyOne({ id: inserted.id }, db);

    assert.ok(found !== undefined);
    assert.equal(found.id, inserted.id);
    assert.equal(found.name, inserted.name);
  });

  it("throws on no result", async () => {
    await assert.rejects(async () => await onlyOne({ id: -1 }, db));
  });
});
