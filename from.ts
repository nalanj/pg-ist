import pg from "pg";
import type z from "zod/v4";
import { snakeCase } from "./case.ts";
import { type SQLQuery, sql, unsafe } from "./sql.ts";

type TypedQuery<T extends z.ZodObject> = {
  schema: T;
  query: SQLQuery;
};

class From {
  fromClause: SQLQuery;
  colsMap: Record<string, SQLQuery>;

  constructor(stringsIn: TemplateStringsArray, ...argsIn: unknown[]) {
    this.fromClause = sql(stringsIn, argsIn);
  }

  cols(colsMap: Record<string, SQLQuery>) {
    this.colsMap = colsMap;
    return this;
  }

  select<T extends z.ZodObject>(schema: T): TypedQuery<T> {
    const asNames = Object.keys(schema.shape);
    let selectClause = sql``;

    for (let i = 0; i < asNames.length; i++) {
      const name = asNames[i];
      const escapedAs = unsafe(pg.escapeIdentifier(snakeCase(name)));
      if (i !== 0) {
        selectClause = sql`${selectClause}, `;
      }

      if (name in this.colsMap) {
        selectClause = sql`${selectClause}${this.colsMap[name]} AS ${escapedAs}`;
      } else {
        selectClause = sql`${selectClause}${escapedAs}`;
      }
    }

    return {
      query: sql`SELECT ${selectClause} FROM ${this.fromClause}`,
      schema,
    };
  }
}

export function from(
  stringsIn: TemplateStringsArray,
  ...argsIn: unknown[]
): From {
  return new From(stringsIn, argsIn);
}
