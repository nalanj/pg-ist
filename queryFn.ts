import type { Queryable } from "./db.js";
import type { QueryResult } from "./query.js";

type QueryFn<T, P> = (props: P, dbOrTx: Queryable) => Promise<QueryResult<T>>;
type OneFn<T, P> = (props: P, dbOrTx: Queryable) => Promise<T | undefined>;
type OnlyOneFn<T, P> = (props: P, dbOrTx: Queryable) => Promise<T>;

export function queryFn<T extends object, P = Record<string, unknown>>(
	strings: TemplateStringsArray,
	...argsIn: (keyof P)[]
): QueryFn<T, P> {
	return (props: P, dbOrTx: Queryable) => {
		const args = argsIn.map((arg) => props[arg]);

		return dbOrTx.query<T>(strings, ...args);
	};
}

export function oneFn<T extends object, P = Record<string, unknown>>(
	strings: TemplateStringsArray,
	...argsIn: (keyof P)[]
): OneFn<T, P> {
	return (props: P, dbOrTx: Queryable) => {
		const args = argsIn.map((arg) => props[arg]);

		return dbOrTx.one<T>(strings, ...args);
	};
}

export function onlyOneFn<T extends object, P = Record<string, unknown>>(
	strings: TemplateStringsArray,
	...argsIn: (keyof P)[]
): OnlyOneFn<T, P> {
	return (props: P, dbOrTx: Queryable) => {
		const args = argsIn.map((arg) => props[arg]);

		return dbOrTx.onlyOne<T>(strings, ...args);
	};
}
