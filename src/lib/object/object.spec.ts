import { expectTypeOf } from "expect-type";
import { $kind, $optional, optional, type Static, type TSchema } from "../base";
import { object, partialObject, record, any } from "./object";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, anyOf, array, boolean } from "../";

describe("object", () => {
   test("basic", () => {
      const schema = object({});
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{}>();
      assertJson(object({}), { type: "object", properties: {} });
   });

   test("with properties", () => {
      const schema = object({
         name: string(),
         age: optional(number()),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name: string; age?: number }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
         required: ["name"],
      });
   });

   test("with optional", () => {
      const schema = object({
         name: string(),
         age: optional(number()),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name: string; age?: number }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
         required: ["name"],
      });
   });

   test("record", () => {
      const schema = record({
         name: string(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name: string }>();

      assertJson(schema, {
         type: "object",
         properties: {},
         additionalProperties: {
            type: "object",
            properties: { name: { type: "string" } },
            required: ["name"],
         },
      });
   });

   test("partialObject", () => {
      const schema = partialObject({
         name: string(),
         // expect this to be non-influential
         age: optional(number()),
      });

      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name?: string; age?: number }>();
      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
         required: undefined,
      });
   });

   test("merging", () => {
      const schema1 = object({ string: string() });
      const schema2 = object({ number: optional(number()) });

      // expect properties to be accessible
      expect(schema1.properties.string[$kind]).toEqual("string");

      const merged = object({
         ...schema1.properties,
         ...schema2.properties,
      });

      expect(Object.keys(merged.properties)).toEqual(["string", "number"]);
      assertJson(merged, {
         type: "object",
         properties: {
            string: { type: "string" },
            number: { type: "number" },
         },
         required: ["string"],
      });
   });

   test("any", () => {
      const schema = any();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<any>();

      expect<any>(schema[$kind]).toEqual("any");

      assertJson(schema, {});
   });

   describe("validate", () => {
      test("base", () => {
         const schema = object({});
         expect(schema.validate({})).toBeUndefined();
         expect(schema.validate(1)).toEqual("type");
      });

      test("properties", () => {
         const schema = object({
            name: string(),
            age: number(),
         });
         expect(schema.validate({ name: "John", age: 30 })).toBeUndefined();
         expect(schema.validate({ name: "John" })).toEqual("required.age");
         expect(schema.validate({ name: "John", age: "30" })).toEqual("type");
         expect(schema.validate({})).toEqual("required.name");
      });

      test("template", () => {
         const schema = object({
            name: string(),
            surname: optional(string()),
         });
         expect(schema.template()).toEqual({ name: "" });
      });
   });
});
