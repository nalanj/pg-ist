import { query, queryExactlyOne, queryOne } from "./query.js";
import { SQLQuery } from "./sql.js";

export class Tx {
	poolClient;
	rolledBack = false;

	constructor(poolClient) {
		this.poolClient = poolClient;
	}

	async query(strings, ...argsIn) {
		const q = new SQLQuery(strings, argsIn);

		return await query(q, this.poolClient);
	}

	async one(strings, ...argsIn) {
		const q = new SQLQuery(strings, argsIn);

		return await queryOne(q, this.poolClient);
	}

	async onlyOne(strings, ...argsIn) {
		const q = new SQLQuery(strings, argsIn);

		return await queryExactlyOne(q, this.poolClient);
	}

	async rollback() {
		await this.query`ROLLBACK`;
		this.rolledBack = true;
	}
}
