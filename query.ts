import pg from "pg";
import { camelCase } from "./case.js";
import { OnlyOneError, UniqueConstraintError } from "./errors.js";

export type QueryResult<T> = {
  length: number;
  [Symbol.iterator]: () => Iterator<T>;
};

export function cursorRowConverter(
  row: Record<string, unknown> | undefined,
): (row: Record<string, unknown>) => Record<string, unknown> {
  if (row === undefined) {
    return () => ({});
  }

  const keys = Object.keys(row);
  const caseMap = keys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = camelCase(key);
    return acc;
  }, {});

  return (row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [caseMap[k], v]));
}

export function rowConverter(
  fields: pg.FieldDef[],
): (row: unknown[]) => unknown {
  const fieldNames = fields.map((field) => camelCase(field.name));

  return (row) => {
    return Object.fromEntries(
      fieldNames.map((fieldName, i) => [fieldName, row[i]]),
    );
  };
}

function queryResult<T>(result: pg.QueryResult): QueryResult<T> {
  const transform = rowConverter(result.fields);

  return {
    length: result.rows.length,
    [Symbol.iterator]: () => {
      let idx = -1;

      return {
        next: () => {
          idx += 1;

          if (idx < result.rows.length) {
            return {
              value: transform(result.rows[idx]) as T,
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
  sql: pg.QueryArrayConfig | string,
  poolClient: pg.PoolClient,
): Promise<QueryResult<T>> {
  try {
    let query: QueryArrayConfig;
    if (typeof sql === "string") {
      query = { text: sql, rowMode: "array" };
    } else {
      query = sql;
    }

    let pgResult = await poolClient.query(query);

    // if the query included multiple queries, only return the results of the
    // last one
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
  sql: pg.QueryArrayConfig | string,
  poolClient: pg.PoolClient,
) {
  return await queryInternal<T>(sql, poolClient);
}

export async function queryOne<T extends object>(
  sql: pg.QueryArrayConfig | string,
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
  sql: pg.QueryArrayConfig | string,
  poolClient: pg.PoolClient,
): Promise<T> {
  const result = await queryOne<T>(sql, poolClient);

  if (!result) {
    throw new OnlyOneError("queryExactlyOne returned no rows");
  }

  return result;
}
