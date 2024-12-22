import pg from "pg";
import { query, queryExactlyOne, queryOne } from "./query.js";
import { SQLQuery } from "./sql.js";
import { Tx } from "./tx.js";

class DB {
	pool;

	constructor(poolConfig) {
		this.pool = new pg.Pool(poolConfig);
	}

	async query(strings, ...argsIn) {
		const q = new SQLQuery(strings, argsIn);

		const client = await this.pool.connect();

		try {
			return await query(q, client);
		} finally {
			await client.release();
		}
	}

	async one(strings, ...argsIn) {
		const q = new SQLQuery(strings, argsIn);

		const client = await this.pool.connect();

		try {
			return await queryOne(q, client);
		} finally {
			await client.release();
		}
	}

	async onlyOne(strings, ...argsIn) {
		const q = new SQLQuery(strings, argsIn);

		const client = await this.pool.connect();

		try {
			return await queryExactlyOne(q, client);
		} finally {
			await client.release();
		}
	}

	async tx(fn) {
		const client = await this.pool.connect();
		await client.query("BEGIN");

		const txn = new Tx(client);

		try {
			await fn(txn);
			await client.query("COMMIT");
		} catch (e) {
			if (!txn.rolledBack) {
				await txn.rollback();
			}

			throw e;
		} finally {
			client.release();
		}
	}

	end() {
		this.pool.end();
	}
}

export function sql2(config) {
	return new DB(config);
}
