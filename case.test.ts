import assert from "node:assert";
import { describe, test } from "node:test";
import { camelCase, snakeCase } from "./case.ts";

describe("camelCase", () => {
  test("simple case", () => {
    assert.strictEqual(camelCase("test_field"), "testField");
  });
});

describe("snakeCase", () => {
  test("simpleCase", () => {
    assert.strictEqual(snakeCase("testField"), "test_field");
  });
});
