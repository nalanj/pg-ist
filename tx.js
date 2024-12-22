import { query, queryExactlyOne, queryOne } from "./query.js";
import { sql } from "./sql.js";

export function tx(poolClient) {
	let rolledBack = false;

	return {
		query: async (strings, ...argsIn) => {
			const q = sql(strings, ...argsIn);

			return await query(q, poolClient);
		},

		one: async (strings, ...argsIn) => {
			const q = sql(strings, ...argsIn);

			return await queryOne(q, poolClient);
		},

		onlyOne: async (strings, ...argsIn) => {
			const q = sql(strings, ...argsIn);

			return await queryExactlyOne(q, poolClient);
		},

		rollback: async () => {
			if (!rolledBack) {
				await query("ROLLBACK;", poolClient);
			}

			rolledBack = true;
		},
	};
}
