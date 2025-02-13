import type pg from "pg";
import { query, queryExactlyOne, queryOne } from "./query.js";
import { sql } from "./sql.js";

export function tx(poolClient: pg.PoolClient) {
	let rolledBack = false;

	return {
		query: async <T extends object>(
			strings: TemplateStringsArray,
			...argsIn: unknown[]
		) => {
			const q = sql(strings, ...argsIn);

			return await query<T>(q, poolClient);
		},

		one: async <T extends object>(
			strings: TemplateStringsArray,
			...argsIn: unknown[]
		) => {
			const q = sql(strings, ...argsIn);

			return await queryOne<T>(q, poolClient);
		},

		onlyOne: async <T extends object>(
			strings: TemplateStringsArray,
			...argsIn: unknown[]
		) => {
			const q = sql(strings, ...argsIn);

			return await queryExactlyOne<T>(q, poolClient);
		},

		rollback: async () => {
			if (!rolledBack) {
				await query("ROLLBACK;", poolClient);
			}

			rolledBack = true;
		},
	};
}
