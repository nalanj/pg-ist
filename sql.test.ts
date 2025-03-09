import assert from "node:assert";
import { describe, it } from "node:test";
import { insertValues, sql } from "./sql.js";

describe("sql", () => {
  it("simple query", () => {
    const yes = 12;
    const out = sql`
    select
      *
    from
      users
    where
      id = ${yes}
  `;

    assert.strictEqual(
      out.text,
      "\n    select\n      *\n    from\n      users\n    where\n      id = $1\n  ",
    );
    assert.deepStrictEqual(out.values, [12]);
  });

  it("nested query", () => {
    const q1 = sql`
    where
      id = ${12}
  `;

    assert.deepStrictEqual(q1.strings, ["\n    where\n      id = ", "\n  "]);

    const q2 = sql`
    from
      users ${q1}
  `;
    const q3 = sql`
    select
      * ${q2}
  `;

    assert.strictEqual(
      q3.text,
      "\n    select\n      * \n    from\n      users \n    where\n      id = $1\n  \n  \n  ",
    );
    assert.deepStrictEqual(q3.values, [12]);
  });
});

describe("insertValues", () => {
  it("works with a single value", () => {
    const q = insertValues(["id", "givenName"], { id: 1, givenName: "Smith" });

    assert.equal(q.text, '("id", "given_name") VALUES ($1, $2)');
    assert.equal(q.values[0], 1);
    assert.equal(q.values[1], "Smith");
  });

  it("works with arrays", () => {
    const q = insertValues(
      ["id", "givenName"],
      { id: 1, givenName: "Smith" },
      { id: 2, givenName: "Jones" },
    );

    assert.equal(q.text, '("id", "given_name") VALUES ($1, $2), ($3, $4)');
    assert.deepEqual(q.values, [1, "Smith", 2, "Jones"]);
  });
});
