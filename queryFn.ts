import type { Queryable } from "./db.js";
import type { QueryResult } from "./query.js";

type QueryFn<T, P> = (props: P, dbOrTx: Queryable) => Promise<QueryResult<T>>;

export function p<P extends string>(param: P): P {
	return param;
}

export function queryFn<T extends object, P = Record<string, unknown>>(
	strings: TemplateStringsArray,
	...argsIn: (keyof P)[]
): QueryFn<T, P> {
	return (props: P, dbOrTx: Queryable) => {
		const args = argsIn.map((arg) => props[arg]);

		return dbOrTx.query<T>(strings, ...args);
	};
}
