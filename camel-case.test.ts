import assert from "node:assert";
import { test } from "node:test";
import { camelCase } from "./camel-case.js";

test("simple case", () => {
  assert.strictEqual(camelCase("test_field"), "testField");
});
