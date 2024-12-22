import pg from "pg";
import { camelCase } from "./camel-case.js";
import { ExactlyOneError, UniqueConstraintError } from "./errors.js";

function result(result) {
	return {
		length: result.rows.length,
		[Symbol.iterator]: () => {
			let idx = -1;

			return {
				next: () => {
					idx += 1;

					if (idx < result.rows.length) {
						return {
							value: Object.fromEntries(
								Object.entries(result.rows[idx]).map(([k, v]) => [
									camelCase(k),
									v,
								]),
							),
							done: false,
						};
					}

					return { done: true };
				},
			};
		},
	};
}

async function queryInternal(sql, poolClient) {
	try {
		let pgResult = await poolClient.query(sql);

		if (Array.isArray(pgResult)) {
			pgResult = pgResult[pgResult.length - 1];
		}

		return result(pgResult);
	} catch (e) {
		if (e instanceof pg.DatabaseError && e.code === "23505") {
			throw UniqueConstraintError.fromDBError(e);
		}

		throw e;
	}
}

export async function query(sql, poolClient) {
	return await queryInternal(sql, poolClient);
}

export async function queryOne(sql, poolClient) {
	const result = await queryInternal(sql, poolClient);

	const first = result[Symbol.iterator]().next();
	if (first.value) {
		return first.value;
	}

	return null;
}

export async function queryExactlyOne(sql, poolClient) {
	const result = await queryOne(sql, poolClient);

	if (!result) {
		throw new ExactlyOneError("queryExactlyOne returned no rows");
	}

	return result;
}
