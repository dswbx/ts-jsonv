import { test, expect, describe } from "bun:test";
import { format as $format } from "./format";

const format = (format: string, value: string) => {
   // @ts-ignore
   return $format({ format }, value);
};

const runTests = (fm: string, tests: any[]) => {
   for (const [value, expected] of tests) {
      expect(
         format(fm, value).valid,
         `expected '${value}' to be ${expected}`
      ).toBe(expected as any);
   }
};

describe("format", () => {
   test("regex", () => {
      runTests("regex", [
         [1, true],
         ["([abc])+\\s+$", true],
         ["^(abc]", false],
      ]);
   });

   test("date", () => {
      runTests("date", [
         [1, true],
         ["2025-01-01", true],
         ["2020-01-31", true],
         ["2020-01-32", false],
         ["2021-02-28", true],
         ["2021-02-29", false],
         ["06/19/1963", false],
         ["1963-06-1৪", false],
      ]);
   });

   test("email", () => {
      runTests("email", [
         [1, true],
         ["test@example.com", true],
         ["~test@example.com", true],
         //['"joe bloggs"@example.com', true],
      ]);
   });
});
