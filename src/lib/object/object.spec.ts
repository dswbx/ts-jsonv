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

      expect<any>(object({})).toEqual({
         type: "object",
         properties: {},
         [$kind]: "object",
      });
      assertJson(object({}), { type: "object", properties: {} });
   });

   test("with properties", () => {
      const schema = object({
         name: string(),
         age: optional(number()),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name: string; age?: number }>();

      expect<any>(schema).toEqual({
         type: "object",
         properties: {
            name: { type: "string", [$kind]: "string" },
            age: { type: "number", [$kind]: "number", [$optional]: true },
         },
         required: ["name"],
         [$kind]: "object",
      });

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

      expect<any>(schema).toEqual({
         type: "object",
         properties: {
            name: { type: "string", [$kind]: "string" },
            age: { type: "number", [$kind]: "number", [$optional]: true },
         },
         required: undefined,
         [$kind]: "object",
      });
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
      expect(schema1.properties.string).toEqual(string());

      const merged = object({
         ...schema1.properties,
         ...schema2.properties,
      });

      expect(Object.keys(merged.properties)).toEqual(["string", "number"]);

      expect<any>(merged).toEqual({
         type: "object",
         [$kind]: "object",
         properties: {
            string: { type: "string", [$kind]: "string" },
            number: { type: "number", [$kind]: "number", [$optional]: true },
         },
         required: ["string"],
      });
   });

   test("any", () => {
      const schema = any();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<any>();

      expect<any>(schema).toEqual({
         [$kind]: "any",
      });

      assertJson(schema, {});
   });
});
