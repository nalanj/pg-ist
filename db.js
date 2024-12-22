import pg from "pg";
import { query, queryExactlyOne, queryOne } from "./query.js";
import { sql } from "./sql.js";
import { tx } from "./tx.js";

export function pgist(config) {
	const pool = new pg.Pool(config);

	return {
		query: async (strings, ...argsIn) => {
			const q = sql(strings, ...argsIn);

			const client = await pool.connect();

			try {
				return await query(q, client);
			} finally {
				await client.release();
			}
		},

		one: async (strings, ...argsIn) => {
			const q = sql(strings, ...argsIn);

			const client = await pool.connect();

			try {
				return await queryOne(q, client);
			} finally {
				await client.release();
			}
		},

		onlyOne: async (strings, ...argsIn) => {
			const q = sql(strings, ...argsIn);

			const client = await pool.connect();

			try {
				return await queryExactlyOne(q, client);
			} finally {
				await client.release();
			}
		},

		tx: async (fn) => {
			const client = await pool.connect();
			await client.query("BEGIN");

			const txn = tx(client);

			try {
				await fn(txn);
				await client.query("COMMIT");
			} catch (e) {
				await txn.rollback();

				throw e;
			} finally {
				client.release();
			}
		},

		end: () => {
			pool.end();
		},
	};
}
