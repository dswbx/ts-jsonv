import { expectTypeOf } from "expect-type";
import { $kind, $optional, optional, type Static, type TSchema } from "../base";
import { allOf, anyOf, oneOf } from "./union";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, object, array } from "../";

describe("union", () => {
   test("anyOf", () => {
      const schema = anyOf([string(), number()]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number>();

      expect<any>(schema).toEqual({
         anyOf: [string(), number()],
         [$kind]: "anyOf",
      });

      assertJson(schema, {
         anyOf: [{ type: "string" }, { type: "number" }],
      });
   });

   test("anyOf with arrays", () => {
      const schema = anyOf([string(), number(), array(string())]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number | string[]>();

      assertJson(schema, {
         anyOf: [
            { type: "string" },
            { type: "number" },
            { type: "array", items: { type: "string" } },
         ],
      });
   });

   test("oneOf", () => {
      const schema = oneOf([string(), number()]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number>();

      expect<any>(schema).toEqual({
         oneOf: [string(), number()],
         [$kind]: "oneOf",
      });

      assertJson(schema, {
         oneOf: [{ type: "string" }, { type: "number" }],
      });
   });

   // use with caution!
   test("allOf", () => {
      const schema = allOf([
         object({ test: string() }),
         object({ what: string() }),
      ]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         test: string;
         what: string;
      }>();

      assertJson(schema, {
         allOf: [
            {
               type: "object",
               properties: { test: { type: "string" } },
               required: ["test"],
            },
            {
               type: "object",
               properties: { what: { type: "string" } },
               required: ["what"],
            },
         ],
      });
   });
});
