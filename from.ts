import pg from "pg";
import type z from "zod/v4";
import { snakeCase } from "./case.ts";
import { type SQLQuery, sql, unsafe } from "./sql.ts";

type TypedQuery<T extends z.ZodObject> = {
  schema: T;
  query: SQLQuery;
};

class From {
  fromClause: SQLQuery = sql``;
  whereClause: SQLQuery = sql``;
  colsMap: Record<string, SQLQuery> = {};

  constructor(basedOn?: From) {
    if (basedOn) {
      this.fromClause = basedOn.fromClause;
      this.whereClause = basedOn.whereClause;
      this.colsMap = basedOn.colsMap;
    }
  }

  cols(colsMap: Record<string, SQLQuery>) {
    const out = new From(this);
    out.colsMap = colsMap;
    return out;
  }

  where(stringsIn: TemplateStringsArray, ...argsIn: unknown[]) {
    const out = new From(this);
    out.whereClause = sql`WHERE ${sql(stringsIn, argsIn)}`;
    return out;
  }

  // group by
  // having
  // order by
  // limit/offset

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
      query: sql`SELECT ${selectClause} FROM ${this.fromClause} ${this.whereClause}`,
      schema,
    };
  }
}

export function from(
  stringsIn: TemplateStringsArray,
  ...argsIn: unknown[]
): From {
  const out = new From();
  out.fromClause = sql(stringsIn, argsIn);
  return out;
}
