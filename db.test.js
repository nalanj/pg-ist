import assert from "node:assert";
import { after, afterEach, beforeEach, test } from "node:test";
import { sql2 } from "./db.js";
import { ExactlyOneError } from "./errors.js";
import { databaseUrl } from "./test.js";

const db = sql2({
	connectionString: databaseUrl,
	allowExitOnIdle: true,
	connectionTimeoutMillis: 3000,
});

beforeEach(async () => {
	await db.query`CREATE TABLE testing (id SERIAL NOT NULL, name TEXT NOT NULL)`;
});

afterEach(async () => {
	await db.query`DROP TABLE testing`;
});

after(() => {
	db.end();
});

test("query", async () => {
	const result =
		await db.query`INSERT INTO testing(name) VALUES (${"Jimmy"}) RETURNING *`;

	assert.deepStrictEqual(result, [{ id: 1, name: "Jimmy" }]);
});

test("one", async () => {
	const result =
		await db.one`INSERT INTO testing(name) VALUES (${"Sally"}), (${"Jimmy"}) RETURNING *`;

	assert.deepStrictEqual(result, { id: 1, name: "Sally" });
});

test("onlyOne with results", async () => {
	const result =
		await db.onlyOne`INSERT INTO testing(name) VALUES (${"Sally"}), (${"Jimmy"}) RETURNING *`;

	assert.deepStrictEqual(result, { id: 1, name: "Sally" });
});

test("onlyOne without results", async () => {
	assert.rejects(
		async () => await db.onlyOne`SELECT * FROM testing`,
		ExactlyOneError,
	);
});

test("tx with success", async () => {
	await db.tx(async (c) => {
		await c.query`INSERT INTO testing(name) VALUES (${"Tx Sally"})`;
	});

	const result = await db.one`SELECT * FROM testing`;
	assert.deepStrictEqual(result, { id: 1, name: "Tx Sally" });
});

test("tx with rollback", async () => {
	await db.tx(async (tx) => {
		await tx.query`INSERT INTO testing(name) VALUES (${"Tx Sally"})`;
		await tx.rollback();
	});

	const result = await db.one`SELECT * FROM testing`;
	assert.strictEqual(result, null);
});

test("tx with exception", async () => {
	let caught = false;
	try {
		await db.tx(async (tx) => {
			await tx.query`INSERT INTO testing(name) VALUES (${"Tx Sally"})`;
			throw new Error("Something broke");
		});
	} catch {
		caught = true;
	}

	assert.strictEqual(caught, true);

	const result = await db.one`SELECT * FROM testing`;
	assert.strictEqual(result, null);
});
