import assert from "node:assert";
import test from "node:test";
import { sql } from "./sql.js";

test("simple query", () => {
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

test("nested query", () => {
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
