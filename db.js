import pg from "pg";
import { query, queryExactlyOne, queryOne } from "./query.js";
import { SQLQuery } from "./sql.js";
import { Tx } from "./tx.js";

export function pgist(config) {
	const pool = new pg.Pool(config);

	return {
		query: async (strings, ...argsIn) => {
			const q = new SQLQuery(strings, argsIn);

			const client = await pool.connect();

			try {
				return await query(q, client);
			} finally {
				await client.release();
			}
		},

		one: async (strings, ...argsIn) => {
			const q = new SQLQuery(strings, argsIn);

			const client = await pool.connect();

			try {
				return await queryOne(q, client);
			} finally {
				await client.release();
			}
		},

		onlyOne: async (strings, ...argsIn) => {
			const q = new SQLQuery(strings, argsIn);

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
		},

		end: () => {
			pool.end();
		},
	};
}
