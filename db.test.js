import assert from "node:assert";
import { after, before, test } from "node:test";
import { pgist } from "./db.js";
import { ExactlyOneError } from "./errors.js";
import { databaseUrl } from "./test.js";

const db = pgist({
	connectionString: databaseUrl,
	allowExitOnIdle: true,
	connectionTimeoutMillis: 3000,
});

before(async () => {
	await db.query`CREATE TABLE IF NOT EXISTS db_testing (id SERIAL NOT NULL, name TEXT NOT NULL)`;
});

after(async () => {
	await db.query`DELETE FROM db_testing`;
	db.end();
});

test("query", async () => {
	const result =
		await db.query`INSERT INTO db_testing(name) VALUES (${"Jimmy"}) RETURNING *`;

	assert.deepStrictEqual(result, [{ id: result[0].id, name: "Jimmy" }]);
});

test("one", async () => {
	const result =
		await db.one`INSERT INTO db_testing(name) VALUES (${"Sally"}), (${"Jimmy"}) RETURNING *`;

	assert.deepStrictEqual(result, { id: result.id, name: "Sally" });
});

test("onlyOne with results", async () => {
	const result =
		await db.onlyOne`INSERT INTO db_testing(name) VALUES (${"Sally"}), (${"Jimmy"}) RETURNING *`;

	assert.deepStrictEqual(result, { id: result.id, name: "Sally" });
});

test("onlyOne without results", async () => {
	await db.query`INSERT INTO db_testing(name) VALUES (${"Sally"}), (${"Jimmy"}) RETURNING *`;

	assert.rejects(
		async () => await db.onlyOne`SELECT * FROM db_testing`,
		ExactlyOneError,
	);
});

test("tx with success", async () => {
	let inserted;
	await db.tx(async (c) => {
		inserted =
			await c.one`INSERT INTO db_testing(name) VALUES (${"Tx Sally"}) RETURNING *`;
	});

	const result =
		await db.one`SELECT * FROM db_testing WHERE id = ${inserted.id}`;

	assert.deepStrictEqual(result, { id: inserted.id, name: "Tx Sally" });
});

test("tx with rollback", async () => {
	let inserted;
	await db.tx(async (tx) => {
		inserted =
			await tx.one`INSERT INTO db_testing(name) VALUES (${"Tx Sally"}) RETURNING *`;
		await tx.rollback();
	});

	const result =
		await db.one`SELECT * FROM db_testing WHERE id = ${inserted.id}`;
	assert.strictEqual(result, null);
});

test("tx with exception", async () => {
	let caught = false;
	let inserted;
	try {
		await db.tx(async (tx) => {
			inserted =
				await tx.one`INSERT INTO db_testing(name) VALUES (${"Tx Sally"}) RETURNING *`;
			throw new Error("Something broke");
		});
	} catch {
		caught = true;
	}

	assert.strictEqual(caught, true);

	const result =
		await db.one`SELECT * FROM db_testing WHERE id = ${inserted.id}`;
	assert.strictEqual(result, null);
});
