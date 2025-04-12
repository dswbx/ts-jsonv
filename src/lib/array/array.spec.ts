import { expectTypeOf } from "expect-type";
import { $kind, $optional, optional, type Static, type TSchema } from "../base";
import { array } from "./array";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, object } from "../";

describe("array", () => {
   test("basic with string", () => {
      {
         const schema = array(string());
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<string[]>();
      }
      {
         const schema = array(string({ const: "hello" }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<"hello"[]>();
      }
      {
         const schema = array(string({ enum: ["hello", "world"] }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<("hello" | "world")[]>();
      }

      expect<any>(array(string())).toEqual({
         type: "array",
         items: { type: "string", [$kind]: "string" },
         [$kind]: "array",
      });
      assertJson(array(string()), {
         type: "array",
         items: { type: "string" },
      });
   });

   test("basic with number", () => {
      {
         const schema = array(number());
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<number[]>();
      }
      {
         const schema = array(number({ const: 1 }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<1[]>();
      }
      {
         const schema = array(number({ enum: [1, 2, 3] }));
         type Inferred = Static<typeof schema>;
         expectTypeOf<Inferred>().toEqualTypeOf<(1 | 2 | 3)[]>();
      }

      expect<any>(array(number())).toEqual({
         type: "array",
         items: { type: "number", [$kind]: "number" },
         [$kind]: "array",
      });
      assertJson(array(number()), {
         type: "array",
         items: { type: "number" },
      });
   });

   test("with objects", () => {
      const schema = array(object({ name: optional(string()), age: number() }));
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<
         { name?: string; age: number }[]
      >();

      expect<any>(schema).toEqual({
         type: "array",
         [$kind]: "array",
         items: {
            type: "object",
            [$kind]: "object",
            properties: {
               name: {
                  type: "string",
                  [$kind]: "string",
                  [$optional]: true,
               },
               age: { type: "number", [$kind]: "number" },
            },
            required: ["age"],
         },
      });

      assertJson(schema, {
         type: "array",
         items: {
            type: "object",
            properties: { name: { type: "string" }, age: { type: "number" } },
            required: ["age"],
         },
      });
   });
});
