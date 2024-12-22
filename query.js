import pg from "pg";
import { camelCase } from "./camel-case.js";
import { ExactlyOneError, UniqueConstraintError } from "./errors.js";

async function queryInternal(sql, poolClient) {
	try {
		let result = await poolClient.query(sql);

		if (Array.isArray(result)) {
			result = result[result.length - 1];
		}

		const out = result.rows.map((row) =>
			Object.keys(row).reduce((acc, k) => {
				acc[camelCase(k)] = row[k];
				return acc;
			}, {}),
		);

		return out;
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

	if (result[0]) {
		return result[0];
	}

	return null;
}

/**
 * Queries with sql and returns exactly one record, or throws an exception.
 * Intended for use when it's known that a single result will be returned, like
 * when running an insert query.
 *
 * @param sql - query to execute
 * @param txClient - transaction client or undefined to use a new transaction
 * @returns a single T
 * @throws when no row is returned from the query
 * @throws when query fails
 */
export async function queryExactlyOne(sql, poolClient) {
	const result = await queryOne(sql, poolClient);

	if (!result) {
		throw new ExactlyOneError("queryExactlyOne returned no rows");
	}

	return result;
}
