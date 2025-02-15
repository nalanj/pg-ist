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
const db = pgist({
  db: { 
    connectionString: "postgres://postgres:postgres@127.0.0.1:5432/pgist-test",
		connectionTimeoutMillis: 3000
  }
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
const result = db.query<User>`SELECT * FROM users WHERE id = ${id}`;

console.log(result.length);

for (const row of result) {
  console.log(row.name);
}
```

#### one

Returns a single object, or `undefined`.

```ts
const result = db.one<User>`SELECT * FROM users WHERE id = ${id}`;

if (result !== undefined) {
  console.log(result.name);
}
```

#### onlyOne

Returns a single object or throws an `ExactlyOneError`. Useful in cases where
if you don't get a result you know something's wrong.

```ts
const result = db.one<User>`SELECT * FROM users WHERE id = ${id}`;
console.log(result.name);
```

### Build queries

#### sql

Build up queries with the `sql` function:

```ts
const select = sql`SELECT * FROM users WHERE id = ${id}`;
```

Queries can be safely combined by nesting:

```ts
const limited = sql`${select} LIMIT ${limit}`;
```

### Transactions

Use `db.tx` to set up a transaction:

```ts
const name = "Alan";
age = 44;

const pets = [{name: "Carmen"}, {name: "Alberta"}, {name: "Dewey"}]

const result = await db.tx(async(tx) => {
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
db.queryFn<User, { id: string }>`SELECT * FROM users WHERE id = ${"id"}`;
```

This defines a function that accepts a properties object with one property, `id`, and returns an iterable set of `User` objects.

### Typedocs

Read the full api documentation at [https://tsdocs.dev/docs/pg-ist/](https://tsdocs.dev/docs/pg-ist/)

## License

MIT. See [LICENSE](/LICENSE)
