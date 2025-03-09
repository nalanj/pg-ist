# 🐘 pg-ist

PostgreSQL powered by template strings

pg-ist is a wrapper around [node-postgres](https://node-postgres.com) to help
make day to day interactions with PostgreSQL easier.

## Installation

```
npm install pg-ist
```

## Usage

### Set up a connection

Use the `pgist` function to set up a new database connection. It accepts any
settings for [`node-postgres` pools](https://node-postgres.com/apis/pool) under the `db` property:

```ts
import { pgist } from "pg-ist";

const db = pgist({
  db: {
    connectionString: "postgres://postgres:postgres@127.0.0.1:5432/pgist-test",
    connectionTimeoutMillis: 3000,
    application_name: "pgist-examples",
  },
  migrationsDir: "./examples/migrations",
});
```

Again, see `https://node-postgres.com/apis/pool` for configuration options for
the `db` property.

### Run queries

Database connections and transactions all implement the `Queryable` interface:

- `query` - returns an `Iterable` set of objects.
- `one` - returns a single object, or undefined if no rows were returned.
- `onlyOne` - returns a single object or throws an exception if no rows were returned.

All query functions return objects with columns converted to camelCase.

Query template strings automatically protect against sql injection.

#### query

Returns an `Iterable` set of rows.

```ts
import { type User, db } from "./db.js";

const id = 5;
const result = await db.query<User>`SELECT * FROM users WHERE id = ${id}`;

console.log(result.length);

for (const row of result) {
  console.log(row.name);
}
```

#### one

Returns a single object, or `undefined`.

```ts
import { type User, db } from "./db.js";

const id = 5;
const result = await db.one<User>`SELECT * FROM users WHERE id = ${id}`;

if (result !== undefined) {
  console.log(result.name);
}
```

#### onlyOne

Returns a single object or throws an `OnlyOneError`. Useful in cases where
if you don't get a result you know something's wrong.

```ts
import { type User, db } from "./db.js";

const id = 5;
const result = await db.onlyOne<User>`SELECT * FROM users WHERE id = ${id}`;
console.log(result.name);
```

### Build queries

#### sql

Build up queries with the `sql` function:

```ts
import { sql } from "pg-ist";

const id = 5;
const select = sql`SELECT * FROM users WHERE id = ${id}`;
```

Queries can be safely combined by nesting:

```ts
import { sql } from "pg-ist";

const id = 5;
const select = sql`SELECT * FROM users WHERE id = ${id}`;

const limit = 10;
const limited = sql`${select} LIMIT ${limit}`;
```

#### insertValues

`insertValues` reduces the drudgery of writing insert queries by accepting an array of columns to insert and objects that should be inserted using those columns. Any columns that are not present in the object are inserted as a `null` value.

> [!WARNING]  
> The first argument to `insertValues`, the list of fields, should be specified in code and never from user input.

```typescript
import { insertValues } from "../sql.js";
import { type User, db } from "./db.js";

const result = await db.query<User>`
  INSERT INTO users ${insertValues(["name", "email"], {
    name: "John",
    email: "john@acmebiz.xyz",
  })} 
  RETURNING *
`;

```

`insertValues` automatically converts fields to camel_case as it inserts objects.

#### updateValues

Like [insertValues](#insertvalues), `updateValues` reduces the drudgery of writing update queries by accepting an array of columns to update and an object that should be inserted using those columns. Any columns that are not present in the object are inserted as a `null` value.

> [!WARNING]  
> The first argument to `updateValues`, the list of fields, should be specified in code and never from user input.

```typescript
import { updateValues } from "../sql.js";
import { type User, db } from "./db.js";

const result = await db.query<User>`
  UPDATE users SET ${updateValues(["name", "email"], {
    name: "John",
    email: "john@acmebiz.xyz",
  })}
  WHERE id = 1
  RETURNING *
`;
```

### Transactions

Use `db.tx` to set up a transaction:

```ts
import { type Pet, type User, db } from "./db.ts";

const name = "Alan";
const age = 44;

const pets = [{ name: "Carmen" }, { name: "Alberta" }, { name: "Dewey" }];

const result = await db.tx(async (tx) => {
  const user = await tx.one<User>`
    INSERT INTO users (name, age) 
    VALUES (${name}, ${age})
    RETURNING *
  `;

  const pets: Pet[] = [];
  for (const pet of pets) {
    pets.push(await tx.onlyOne`INSERT INTO pets (name) VALUES (${name})`);
  }

  return { human: user, pets };
});
```

`db.tx` returns whatever the function given to it returns. The argument to the
transaction function, `tx`, includes a property `rollback()` to roll back the
transaction at any point. If any exception is thrown inside of the transaction
it also causes the transaction to roll back.

### Define query functions

`pg-ist` includes the ability to efficiently define query functions. `queryFn`,
`oneFn`, and `onlyOneFn` are all available.

```ts
import { type User, db } from "./db.js";

db.queryFn<User, { id: string }>`SELECT * FROM users WHERE id = ${"id"}`;
```

This defines a function that accepts a properties object with one property, `id`, and returns an iterable set of `User` objects.

### Cursors

`pg-ist` supports cursors. They're ideal for situations where you need to iterate over large sets of rows.

```ts
import { type User, db } from "./db.js";

const cursor = db.cursor(100);
for await (const row of await cursor<User>`SELECT * FROM users`) {
  console.log(row);
}
```

### Migrations

pg-ist includes a simple migrations system, most based around using the pg-ist
query functions. 

pg-ist migrations are built by specifying a JavaScript or TypeScript file with a timestamp based prefix and exporting a single default function to migrate up.

> [!IMPORTANT]  
> pg-ist migrations do not include down migrations. You'll need to either reset the database and re-migrate or manually modify the `migrations` table and alter your schema.

Here's an example migration:

```ts
import type { Queryable } from "../../db.js";

export default async function up(db: Queryable) {
  await db.query`
    CREATE TABLE IF NOT EXISTS orgs (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
}
```

See the [CLI](#cli) documentation for more details around specific migration commands.

> [!WARNING]  
> pg-ist migrations use advisory locks to ensure only one migration runs at a time. Ensure your connection is able to utilize advisory locks. It's generally not recommend to run database migrations through a PgBouncer instance.

## CLI

pg-ist includes support for creating a CLI against your database. It's included as a function rather than a defined CLI application so that you can easily configure it with code.

Here's an example CLI script:

```
#!/usr/bin/env -S npx tsx
import { cli } from "../index.js";
import { db } from "./db.js";

const out = await cli(db, "cli");
await db.end();

process.exit(out);

```

### CLI Commands

#### `[cli] query "[sql]"`

Runs a query and returns the results as newline delimited json.

```sh
> examples/cli query "SELECT * FROM db_testing"             
{"id":1187,"name":"BOB"}
{"id":1188,"name":"SALLY"}
{"id":1189,"name":"EUNICE"}
```

#### `[cli] migrate create`

Creates a new migration file.

##### Options:

- `--typescript` - generate migration file as TypeScript

```sh
> examples/cli migrate create create-uploads

Created migration examples/migrations/20250309154340-create-uploads.js
```

#### `[cli] migrate status`

Displays the current migration status.

```sh
> examples/cli migrate status

Currently migrated to 20250309153536
```

#### `[cli] migrate pending`

Displays a list of pending migrations.

```sh
> examples/cli migrate pending

Pending migrations:
  - 20250309154340-create-uploads.ts
```

#### `[cli] migrate run`

Runs pending migrations

```sh
> examples/cli migrate run

Migrating:
  - 20250309154340-create-uploads.ts
```

## Typedocs

Read the full api documentation at [https://tsdocs.dev/docs/pg-ist/](https://tsdocs.dev/docs/pg-ist/)

## License

MIT. See [LICENSE](/LICENSE)
