import { expectTypeOf } from "expect-type";
import { $kind, type Static } from "../base";
import { object, partialObject, record, any, strictObject } from "./object";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number } from "../";

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
         age: number().optional(),
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

   test("strictObject", () => {
      const schema = strictObject({
         name: string(),
         age: number(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name: string; age: number }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
         required: ["name", "age"],
         additionalProperties: false,
      });
   });

   test("partialObject", () => {
      const schema = partialObject({
         name: string(),
         age: number(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name?: string; age?: number }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
         },
      });
   });

   test("objects of objects", () => {
      const schema = object({
         name: string(),
         age: number(),
         address: object({
            street: string(),
            city: string(),
         }),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         name: string;
         age: number;
         address: { street: string; city: string };
      }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: { type: "string" },
            age: { type: "number" },
            address: {
               type: "object",
               properties: {
                  street: { type: "string" },
                  city: { type: "string" },
               },
               required: ["street", "city"],
            },
         },
         required: ["name", "age", "address"],
      });
   });

   test("with optional", () => {
      const schema = object({
         name: string(),
         age: number().optional(),
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
         age: number().optional(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         [key: string]: { name: string; age?: number };
      }>();

      assertJson(schema, {
         type: "object",
         additionalProperties: {
            type: "object",
            properties: { name: { type: "string" }, age: { type: "number" } },
            required: ["name"],
         },
      });
   });

   test("partialObject", () => {
      const schema = partialObject({
         name: string(),
         // expect this to be non-influential
         age: number().optional(),
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
      const schema2 = object({ number: number().optional() });

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
            surname: string().optional(),
         });
         expect(schema.template()).toEqual({ name: "" });
      });
   });

   test("coerce", () => {
      const schema = object({
         name: string(),
         age: number(),
      });
      expect(schema.coerce("{}")).toEqual({});
      expect(schema.coerce('{"name": "John", "age": "30"}')).toEqual({
         name: "John",
         age: 30,
      });
      expect(schema.coerce({ name: "John", age: "30" })).toEqual({
         name: "John",
         age: 30,
      });
   });
});
