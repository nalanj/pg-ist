import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { pgist } from "./db.js";
import { p, queryFn } from "./queryFn.js";
import { databaseUrl } from "./test-help.js";

const db = pgist({
	connectionString: databaseUrl,
	allowExitOnIdle: true,
	connectionTimeoutMillis: 3000,
});

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
		>`SELECT * FROM queryfn_testing WHERE id = ${p("id")}`;

		const inserted =
			await db.onlyOne<QueryFnTesting>`INSERT INTO queryfn_testing(name) VALUES (${"Jimmy"}) RETURNING *`;

		const found = await find({ id: inserted.id }, db);

		assert.equal(found.length, 1);
		const rows = Array.from(found);
		assert.equal(rows[0].id, inserted.id);
		assert.equal(rows[0].name, inserted.name);
	});
});
