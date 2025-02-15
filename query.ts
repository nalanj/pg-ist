import pg from "pg";
import { camelCase } from "./camel-case.js";
import { ExactlyOneError, UniqueConstraintError } from "./errors.js";

export type QueryResult<T> = {
	length: number;
	[Symbol.iterator]: () => Iterator<T>;
};

function queryResult<T>(result: pg.QueryResult): QueryResult<T> {
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
							) as T,
							done: false,
						};
					}

					return { done: true, value: undefined };
				},
			};
		},
	};
}

async function queryInternal<T extends object>(
	sql: pg.QueryConfig | string,
	poolClient: pg.PoolClient,
): Promise<QueryResult<T>> {
	try {
		let pgResult = await poolClient.query(sql);

		if (Array.isArray(pgResult)) {
			pgResult = pgResult[pgResult.length - 1];
		}

		return queryResult<T>(pgResult);
	} catch (e) {
		if (e instanceof pg.DatabaseError && e.code === "23505") {
			throw UniqueConstraintError.fromDBError(e);
		}

		throw e;
	}
}

export async function query<T extends object>(
	sql: pg.QueryConfig | string,
	poolClient: pg.PoolClient,
) {
	return await queryInternal<T>(sql, poolClient);
}

export async function queryOne<T extends object>(
	sql: pg.QueryConfig | string,
	poolClient: pg.PoolClient,
): Promise<T | undefined> {
	const result = await queryInternal<T>(sql, poolClient);

	const first = result[Symbol.iterator]().next();
	if (first.value) {
		return first.value as T;
	}

	return undefined;
}

export async function queryOnlyOne<T extends object>(
	sql: pg.QueryConfig | string,
	poolClient: pg.PoolClient,
): Promise<T> {
	const result = await queryOne<T>(sql, poolClient);

	if (!result) {
		throw new ExactlyOneError("queryExactlyOne returned no rows");
	}

	return result;
}
