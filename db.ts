import pg from "pg";
import Cursor from "pg-cursor";
import { type QueryResult, query, queryOne, queryOnlyOne } from "./query.js";
import { cursorRowConverter } from "./query.js";
import { sql } from "./sql.js";
import { tx } from "./tx.js";

/**
 * Configuration for pg-ist
 */
export type PgistConfig = {
  /**
   * Configuration for the underline node-postgres pool.
   * See [https://node-postgres.com/apis/pool](https://node-postgres.com/apis/pool)
   * for more details.
   */
  db: pg.PoolConfig;

  /**
   * The directory where migration files are located
   */
  migrationsDir?: string;
};

export type TxFn<T> = (txn: ReturnType<typeof tx>) => Promise<T>;
export type Queryable = {
  query: <T extends object>(
    strings: TemplateStringsArray,
    ...argsIn: unknown[]
  ) => Promise<QueryResult<T>>;

  one: <T extends object>(
    strings: TemplateStringsArray,
    ...argsIn: unknown[]
  ) => Promise<T | undefined>;

  onlyOne: <T extends object>(
    strings: TemplateStringsArray,
    ...argsIn: unknown[]
  ) => Promise<T>;
};

export class DB implements Queryable {
  pool: pg.Pool;
  config: PgistConfig;

  constructor(config: PgistConfig) {
    this.config = config;
    this.pool = new pg.Pool(config.db);
  }

  async query<T extends object>(
    strings: TemplateStringsArray,
    ...argsIn: unknown[]
  ) {
    const q = sql(strings, ...argsIn);

    const client = await this.pool.connect();

    try {
      return await query<T>(q, client);
    } finally {
      client.release();
    }
  }

  async one<T extends object>(
    strings: TemplateStringsArray,
    ...argsIn: unknown[]
  ) {
    const q = sql(strings, ...argsIn);

    const client = await this.pool.connect();

    try {
      return await queryOne<T>(q, client);
    } finally {
      await client.release();
    }
  }

  async onlyOne<T extends object>(
    strings: TemplateStringsArray,
    ...argsIn: unknown[]
  ) {
    const q = sql(strings, ...argsIn);

    const client = await this.pool.connect();

    try {
      return await queryOnlyOne<T>(q, client);
    } finally {
      await client.release();
    }
  }

  cursor(rowCount = 100) {
    const pool = this.pool;

    return async function* <T extends object>(
      strings: TemplateStringsArray,
      ...argsIn: unknown[]
    ) {
      const client = await pool.connect();

      try {
        const q = sql(strings, ...argsIn);
        const cursor = new Cursor(q.text, q.values);

        const result = client.query(cursor);

        let rows = await result.read(rowCount);
        const transform = cursorRowConverter(rows[0]);

        while (rows.length > 0) {
          for (const row of rows) {
            yield transform(row) as T;
          }

          rows = await result.read(rowCount);
        }
      } finally {
        await client.release();
      }
    };
  }

  /**
   * Execute `fn` in a transaction.
   * @param fn - a function to run within a transaction
   * @returns the return value of fn
   */
  async tx<T>(fn: TxFn<T>) {
    const client = await this.pool.connect();
    await client.query("BEGIN");

    const txn = tx(client);

    let caught = false;
    try {
      return await fn(txn);
    } catch (e) {
      caught = true;
      await txn.rollback();

      throw e;
    } finally {
      if (!caught) {
        await client.query("COMMIT");
      }

      client.release();
    }
  }

  end() {
    this.pool.end();
  }
}

/**
 * Sets up a new database connection.
 */
export function pgist(config: PgistConfig) {
  return new DB(config);
}
