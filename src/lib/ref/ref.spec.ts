import { expectTypeOf } from "expect-type";
import { type Static, type StaticCoerced } from "../static";
import { recursive, ref, refId } from "./ref";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import {
   string,
   number,
   object,
   anyOf,
   partialObject,
   array,
   type TSchema,
   type TSchemaInOut,
   schema,
} from "../";
import { $kind } from "../symbols";

describe("ref", () => {
   test("basic", () => {
      const referenced = string({ $id: "string" });
      const schema = ref(referenced);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();

      expect<any>(schema[$kind]).toEqual("ref");
      expect<any>(schema.$ref).toEqual("string");
      assertJson(schema, {
         $ref: "string",
      });
   });

   test("checks $id", () => {
      // @ts-expect-error must have $id set
      expect(() => ref(string())).toThrow();
   });

   test("prefix", () => {
      const schema = ref(string({ $id: "string" }), "#$defs/somewhereelse");
      expect(schema.$ref).toEqual("#$defs/somewhereelse");
   });

   test("refId", () => {
      const s = refId("#/$defs/string");
      expect(s.$ref).toEqual("#/$defs/string");
      expectTypeOf<(typeof s)["$ref"]>().toEqualTypeOf<"#/$defs/string">();
      const s2 = refId("string");
      expectTypeOf<(typeof s2)["$ref"]>().toEqualTypeOf<"string">();
      expect(s2.$ref).toEqual("string");

      const s3 = refId<{ foo: 1 }>("whatever");
      expectTypeOf<(typeof s3)["$ref"]>().toEqualTypeOf<string>();
      expectTypeOf<Static<typeof s3>>().toEqualTypeOf<{ foo: 1 }>();
      expect(s3.$ref).toEqual("whatever");
   });

   test("rec with coerce", () => {
      const s = anyOf([number({ default: 10 }), string()], {
         coerce: Number,
         $id: "numberOrString",
      });
      const query = object(
         {
            limit: ref(s, "#/$defs/numberOrString"),
            offset: number(),
         },
         {
            $defs: {
               numberOrString: s,
            },
         }
      );
      type Inferred = Static<typeof query>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         limit: number | string;
         offset: number;
      }>();
      type Coerced = StaticCoerced<typeof query>;
      expectTypeOf<Coerced>().toEqualTypeOf<{
         limit: number;
         offset: number;
      }>();
      expect(query.toJSON()).toEqual({
         $defs: {
            numberOrString: {
               $id: "numberOrString",
               anyOf: [{ type: "number", default: 10 }, { type: "string" }],
            },
         },
         type: "object",
         properties: {
            limit: { $ref: "#/$defs/numberOrString" },
            offset: { type: "number" },
         },
         required: ["limit", "offset"],
      });
   });

   test("rec", () => {
      const schema = partialObject(
         {
            limit: number(),
            with: refId("schema"),
         },
         {
            $id: "schema",
         }
      );

      expect(schema.toJSON()).toEqual({
         $id: "schema",
         type: "object",
         properties: {
            limit: {
               type: "number",
            },
            with: {
               $ref: "schema",
            },
         },
      });

      expect(
         schema.validate(
            {
               limit: 1,
               with: {
                  limit: "1",
               },
            },
            {
               ignoreUnsupported: true,
            }
         )
      ).toEqual({
         valid: false,
         errors: [
            {
               keywordLocation: "/properties/with/properties/limit/type",
               instanceLocation: "/with/limit",
               error: "Expected number",
               data: "1",
            },
         ],
      });

      expect(schema.coerce({ limit: "1" })).toEqual({ limit: 1 });
      expect(schema.coerce({ limit: "1", with: { limit: "1" } })).toEqual({
         limit: 1,
         with: {
            limit: 1,
         },
      });
   });

   test("rec within union", () => {
      const schema = object({
         limit: number(),
         with: anyOf([string(), refId("#")]).optional(),
      });
      expect(schema.coerce({ limit: 1, with: { limit: "1" } })).toEqual({
         limit: 1,
         with: {
            limit: 1,
         },
      });
   });

   test("rec...", () => {
      const s = object({
         id: string(),
         nodes: array(),
      });

      expect(s.coerce({ id: 1 })).toEqual({ id: "1" });
   });

   describe("recursive", () => {
      test("types", () => {
         const s = recursive((tthis) =>
            object({
               id: string(),
               nodes: array(tthis),
            })
         );
         type Inferred = Static<typeof s>;
         expectTypeOf<Inferred>().toEqualTypeOf<{
            id: string;
            nodes: unknown[];
         }>();
         type Coerced = StaticCoerced<typeof s>;
         expectTypeOf<Coerced>().toEqualTypeOf<{
            id: string;
            nodes: unknown[];
         }>();
      });

      test.only("types with self fn", () => {
         const withSchema = <T>(self: TSchema): TSchemaInOut<T, T> =>
            anyOf([self, array(self)]);

         const s = recursive((tthis) =>
            partialObject(
               {
                  id: string(),
                  nodes: withSchema(tthis),
               },
               {
                  additionalProperties: schema(false),
               }
            )
         );
         type Inferred = Static<typeof s>;
         expectTypeOf<Inferred>().toEqualTypeOf<{
            id?: string;
            nodes?: unknown;
         }>();
         type Coerced = StaticCoerced<typeof s>;
         expectTypeOf<Coerced>().toEqualTypeOf<{
            id?: string;
            nodes?: unknown;
         }>();

         const example = {
            id: 1,
            nodes: { id: 2, nodes: [] },
         };
         console.log(s.coerce(example));
         console.log(
            s.validate(example, {
               ignoreUnsupported: true,
            })
         );
      });

      test("raw", () => {
         const s = recursive((tthis) =>
            object({
               id: string(),
               nodes: array(tthis),
            })
         );
         expect(s.toJSON()).toEqual({
            type: "object",
            properties: {
               id: {
                  type: "string",
               },
               nodes: {
                  type: "array",
                  items: {
                     $ref: "#",
                  },
               },
            },
            required: ["id", "nodes"],
         });
         expect(s.coerce({ id: 1, nodes: [{ id: "2", nodes: [] }] })).toEqual({
            id: "1",
            nodes: [{ id: "2", nodes: [] }],
         });
         expect(
            s.validate(
               { id: "1", nodes: [{ id: 2, nodes: [] }] },
               {
                  ignoreUnsupported: true,
               }
            )
         ).toEqual({
            valid: false,
            errors: [
               {
                  keywordLocation: "/properties/nodes/items/properties/id/type",
                  instanceLocation: "/nodes/0/id",
                  error: "Expected string",
                  data: 2,
               },
            ],
         });
      });
   });
});
