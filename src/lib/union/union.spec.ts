import { expectTypeOf } from "expect-type";
import type { Static, StaticCoerced } from "../static";
import { $kind } from "../symbols";
import { allOf, anyOf, oneOf } from "./union";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, object, array, any, integer } from "../";

describe("union", () => {
   test("anyOf", () => {
      const schema = anyOf([string(), number()]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number>();

      expect<any>(schema[$kind]).toEqual("anyOf");

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

   test("anyOf with objects", () => {
      const one = object({
         type: string({ const: "ref/resource" }),
         uri: string().optional(),
      });
      type OneStatic = (typeof one)["static"];
      //   ^?
      type OneInferred = Static<typeof one>;
      //   ^?

      const aobj = array(object({ name: string() }));
      type AobjStatic = (typeof aobj)["static"];
      //   ^?
      type AobjInferred = Static<typeof aobj>;
      //   ^?

      const schema = anyOf([
         one,
         object({
            type: string({ const: "ref/tool" }),
            name: string(),
         }),
      ]);
      type AnyOfStatic = (typeof schema)["static"];
      //   ^?
      expectTypeOf<AnyOfStatic>().toEqualTypeOf<
         | {
              type: "ref/resource";
              uri?: string;
              [key: string]: unknown;
           }
         | {
              type: "ref/tool";
              name: string;
              [key: string]: unknown;
           }
      >();
      type AnyOfInferred = Static<typeof schema>;
      //   ^?
      expectTypeOf<AnyOfInferred>().toEqualTypeOf<
         | {
              type: "ref/resource";
              uri?: string;
              [key: string]: unknown;
           }
         | {
              type: "ref/tool";
              name: string;
              [key: string]: unknown;
           }
      >();
   });

   test("oneOf", () => {
      const schema = oneOf([string(), number()]);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string | number>();

      expect<any>(schema[$kind]).toEqual("oneOf");

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
         [key: string]: unknown;
      }>();

      //console.log(JSON.stringify(schema, null, 2));
      assertJson(schema, {
         type: "object",
         required: ["test", "what"],
         properties: {
            test: {
               type: "string",
            },
            what: {
               type: "string",
            },
         },
      });
   });

   test("allOf complex", () => {
      const schema = allOf([
         object({
            bar: number(),
         }),
         object({
            foo: string(),
         }),
      ]);
      //console.log(schema);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         bar: number;
         foo: string;
         [key: string]: unknown;
      }>();
   });

   test("template", () => {
      const schema = anyOf([string(), number()], { default: 1 });
      expect(schema.template()).toEqual(1);
   });

   test("validation", () => {
      const schema = anyOf([integer(), any({ minimum: 2 })]);
      expect(schema.validate(1).valid).toEqual(true);
      expect(schema.validate(2.5).valid).toEqual(true);
      expect(schema.validate(3).valid).toEqual(true);
      expect(schema.validate(1.5).valid).toEqual(false);
   });

   test("coerce", () => {
      const schema = anyOf([string(), array(string())], {
         coerce: function (this: any, value: unknown): string[] {
            //console.log("--calling custom coerce", { value, _this: this });
            if (typeof value === "string" && value.includes(",")) {
               return value.split(",");
            } else if (Array.isArray(value)) {
               return value.map(String);
            }
            return [String(value)];
         },
      });
      type Inferred = StaticCoerced<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string[]>();

      expect(schema.coerce("test")).toEqual(["test"]);
      expect(schema.coerce("test,test2")).toEqual(["test", "test2"]);
      expect(schema.coerce(["test", "test2"])).toEqual(["test", "test2"]);
   });
});
