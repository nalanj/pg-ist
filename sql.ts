import pg from "pg";
import { snakeCase } from "./case.js";

class SQLQuery {
  strings: string[];
  values: unknown[];
  rowMode = "array" as const;

  constructor(strings: string[], values: unknown[]) {
    this.strings = strings;
    this.values = values;
  }

  get text() {
    let out = "";
    this.strings.slice(0, -1).forEach((string, idx) => {
      out += `${string}$${idx + 1}`;
    });

    out += this.strings[this.strings.length - 1];

    return out;
  }
}

export function sql(
  stringsIn: TemplateStringsArray,
  ...argsIn: unknown[]
): SQLQuery {
  const values: unknown[] = [];
  const strings: string[] = [];

  if (stringsIn.length === 1 && stringsIn[0]) {
    const firstString = stringsIn[0];

    // short circuit when no args
    return new SQLQuery([firstString], values);
  }

  let outOffset = 0;
  for (let inOffset = 0; inOffset < argsIn.length; inOffset++) {
    const arg = argsIn[inOffset];

    if (arg instanceof SQLQuery) {
      // merge the opening string of the query arg into the previous string
      strings[outOffset] = strings[outOffset]
        ? strings[outOffset] + (stringsIn[inOffset] ?? "") + arg.strings[0]
        : stringsIn[inOffset] + (arg.strings[0] ?? "");

      strings.splice(outOffset + 1, 0, ...arg.strings.slice(1));
      values.splice(outOffset, 0, ...arg.values);
      outOffset += arg.strings.length - 1;
    } else {
      strings[outOffset] = strings[outOffset]
        ? strings[outOffset] + (stringsIn[inOffset] ?? "")
        : (stringsIn[inOffset] ?? "");

      values[outOffset] = arg;
      outOffset += 1;
    }

    // append the last string
    if (inOffset === argsIn.length - 1) {
      strings[outOffset] = strings[outOffset]
        ? strings[outOffset] + (stringsIn[inOffset + 1] ?? "")
        : (stringsIn[inOffset + 1] ?? "");
    }
  }

  return new SQLQuery(strings, values);
}

export function unsafe(unsafeString: string): SQLQuery {
  return new SQLQuery([unsafeString], []);
}

export function insertValues<const InsertFields extends [string, ...string[]]>(
  fields: InsertFields,
  ...rows: Record<string, unknown>[]
): SQLQuery {
  if (fields.length <= 0) {
    throw new Error("Cannot generate insert for no fields");
  }

  const columns = unsafe(
    fields.map((field) => pg.escapeIdentifier(snakeCase(field))).join(", "),
  );

  const itemTemplate = [Array(fields.length - 1).fill(", "), ")"];

  const values = sql`(`;
  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (!row) {
      throw new Error(`Row ${idx} is undefined`);
    }

    values.strings = values.strings.concat(...itemTemplate);

    for (const field of fields) {
      const value = (row[field] as unknown) || null;
      values.values.push(value);
    }

    if (idx !== rows.length - 1) {
      values.strings[values.strings.length - 1] += ", (";
    }
  }

  return sql`(${columns}) VALUES ${values}`;
}

export function updateValues<const UpdateFields extends [string, ...string[]]>(
  fields: UpdateFields,
  setValues: Record<string, unknown>,
): SQLQuery {
  if (fields.length <= 0) {
    throw new Error("Cannot generate update for no fields");
  }

  const set = sql`SET`;
  for (const field of fields) {
    set.strings[set.strings.length - 1] =
      `${set.strings[set.strings.length - 1]} ${pg.escapeIdentifier(snakeCase(field))} = `;
    set.values.push((setValues[field] as unknown) || null);
    set.strings.push(",");
  }
  set.strings[set.strings.length - 1] = "";

  return set;
}
