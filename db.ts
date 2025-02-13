import pg from "pg";
import { query, queryExactlyOne, queryOne } from "./query.js";
import { sql } from "./sql.js";
import { tx } from "./tx.js";

export type PgistConfig = pg.PoolConfig;
export type TxFn<T> = (txn: ReturnType<typeof tx>) => Promise<T>;

export function pgist(config: PgistConfig) {
	const pool = new pg.Pool(config);

	return {
		query: async <T extends object>(
			strings: TemplateStringsArray,
			...argsIn: unknown[]
		) => {
			const q = sql(strings, ...argsIn);

			const client = await pool.connect();

			try {
				return await query<T>(q, client);
			} finally {
				await client.release();
			}
		},

		one: async <T extends object>(
			strings: TemplateStringsArray,
			...argsIn: unknown[]
		) => {
			const q = sql(strings, ...argsIn);

			const client = await pool.connect();

			try {
				return await queryOne<T>(q, client);
			} finally {
				await client.release();
			}
		},

		onlyOne: async <T extends object>(
			strings: TemplateStringsArray,
			...argsIn: unknown[]
		) => {
			const q = sql(strings, ...argsIn);

			const client = await pool.connect();

			try {
				return await queryExactlyOne<T>(q, client);
			} finally {
				await client.release();
			}
		},

		tx: async <T>(fn: TxFn<T>): Promise<T> => {
			const client = await pool.connect();
			await client.query("BEGIN");

			const txn = tx(client);

			let caught = false;
			try {
				return await fn(txn);
			} catch (e) {
				caught = true;
				await txn.rollback();

				throw e;
			} finally {
				if (!caught) {
					await client.query("COMMIT");
				}

				client.release();
			}
		},

		end: () => {
			pool.end();
		},
	};
}
