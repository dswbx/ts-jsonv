import { expectTypeOf } from "expect-type";
import { optional, type Static } from "../base";
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

      assertJson(schema, {
         type: "array",
         items: {
            type: "object",
            properties: { name: { type: "string" }, age: { type: "number" } },
            required: ["age"],
         },
      });
   });

   describe("validate", () => {
      test("base", () => {
         const schema = array(string());
         expect(schema.validate({})).toEqual("type");
      });

      test("minItems", () => {
         const schema = array(string(), { minItems: 2 });
         expect(schema.validate(["a"])).toEqual("minItems");
         expect(schema.validate(["a", "b"])).toBeUndefined();
      });

      test("maxItems", () => {
         const schema = array(string(), { maxItems: 2 });
         expect(schema.validate(["a", "b", "c"])).toEqual("maxItems");
         expect(schema.validate(["a", "b"])).toBeUndefined();
      });
   });

   test("template", () => {
      const schema = array(string());
      expect(schema.template()).toEqual([]);
   });
});
