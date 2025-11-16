import assert from "node:assert";
import { test } from "node:test";
import { from } from "./from.ts";
import * as z from "zod";
import { sql } from "./sql.ts";

test("whatever", () => {
  const res = from`users LEFT JOIN orgs ON orgs.id = users.id`
    .cols({ userId: sql`id` })
    .select(
      z.object({
        userId: z.string(),
        name: z.string(),
      }),
    );

  console.log(res);
});
