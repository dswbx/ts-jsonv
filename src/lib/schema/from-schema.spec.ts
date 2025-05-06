import { describe, expect, test } from "bun:test";
import { fromSchema } from "./from-schema";
import * as lib from "..";

const expectType = (
   schema: lib.TSchema,
   type: string,
   additional: Record<string, any> = {}
) => {
   expect(schema[lib.$kind]).toEqual(type);

   const keys = Object.keys(additional);
   for (const key of keys) {
      expect(schema[key]).toEqual(additional[key]);
   }
};

describe("fromSchema", () => {
   test("base", () => {
      expectType(fromSchema({ type: "string" } as const), "string");
      expectType(
         fromSchema({
            type: "string",
            maxLength: 10,
            minLength: 1,
            pattern: "/a/",
         } as const),
         "string",
         {
            maxLength: 10,
            minLength: 1,
            pattern: "/a/",
         }
      );
      expectType(fromSchema({ type: "number" } as const), "number");
      expectType(
         fromSchema({
            type: "number",
            exclusiveMaximum: 1,
            multipleOf: 1,
            minimum: 1,
            exclusiveMinimum: 1,
            maximum: 2,
         } as const),
         "number",
         {
            exclusiveMaximum: 1,
            multipleOf: 1,
            minimum: 1,
            maximum: 2,
            exclusiveMinimum: 1,
         }
      );
      expectType(fromSchema({ type: "integer" } as const), "integer");
      expectType(fromSchema({ type: "boolean" } as const), "boolean");
   });

   test("objects", () => {
      expectType(
         fromSchema({
            type: "object",
            properties: { name: { type: "string" } },
         } as const),
         "object"
      );
   });

   test("arrays", () => {
      const schema = fromSchema({
         type: "array",
         items: { type: "string" },
      } as const);
      expectType(schema, "array");
      // @ts-ignore
      expectType(schema.items, "string");
   });
});
