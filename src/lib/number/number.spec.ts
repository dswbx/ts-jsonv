import { expectTypeOf } from "expect-type";
import { type Static, type TSchema } from "../base";
import { number } from "./number";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";

describe("number", () => {
   test("basic", () => {
      const schema = number();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<number>();

      assertJson(number(), { type: "number" });
   });

   test("with const", () => {
      const schema = number({ const: 1 });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1>();

      assertJson(number({ const: 1 }), {
         type: "number",
         const: 1,
      });
   });

   test("with enum", () => {
      const schema = number({ enum: [1, 2, 3] });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1 | 2 | 3>();

      assertJson(number({ enum: [1, 2, 3] }), {
         type: "number",
         enum: [1, 2, 3],
      });
   });

   test("number schema", () => {
      assertJson(number({ minimum: 1 }), {
         type: "number",
         minimum: 1,
      });
      assertJson(number({ maximum: 1 }), {
         type: "number",
         maximum: 1,
      });
      assertJson(number({ multipleOf: 1 }), {
         type: "number",
         multipleOf: 1,
      });
   });

   describe("validate", () => {
      test("base", () => {
         const schema = number();
         expect(schema.validate(1)).toBeUndefined();
         expect(schema.validate("1")).toEqual("type");
         expect(schema.validate(undefined)).toEqual("type");
         expect(schema.validate(null)).toEqual("type");
         expect(schema.validate({})).toEqual("type");
         expect(schema.validate([])).toEqual("type");
      });

      test("const", () => {
         const schema = number({ const: 1 });
         expect(schema.validate(1)).toBeUndefined();
         expect(schema.validate(2)).toEqual("const");
      });

      test("enum", () => {
         const schema = number({ enum: [1, 2, 3] });
         expect(schema.validate(1)).toBeUndefined();
         expect(schema.validate(2)).toBeUndefined();
         expect(schema.validate(3)).toBeUndefined();
         expect(schema.validate(4)).toEqual("enum");
      });

      test("multipleOf", () => {
         const schema = number({ multipleOf: 2 });
         expect(schema.validate(2)).toBeUndefined();
         expect(schema.validate(3)).toEqual("multipleOf");
         expect(schema.validate(4)).toBeUndefined();
      });

      test("maximum", () => {
         const schema = number({ maximum: 1 });
         expect(schema.validate(1)).toBeUndefined();
         expect(schema.validate(2)).toEqual("maximum");
      });

      test("exclusiveMaximum", () => {
         const schema = number({ exclusiveMaximum: 3 });
         expect(schema.validate(3)).toEqual("exclusiveMaximum");
         expect(schema.validate(2)).toBeUndefined();
      });

      test("minimum", () => {
         const schema = number({ minimum: 1 });
         expect(schema.validate(1)).toBeUndefined();
         expect(schema.validate(0)).toEqual("minimum");
      });

      test("exclusiveMinimum", () => {
         const schema = number({ exclusiveMinimum: 1 });
         expect(schema.validate(1)).toEqual("exclusiveMinimum");
         expect(schema.validate(2)).toBeUndefined();
      });
   });

   test("template", () => {
      expect(number().template()).toEqual(0);
      expect(number({ minimum: 1 }).template()).toEqual(1);
      expect(number({ exclusiveMinimum: 1 }).template()).toEqual(2);
      expect(number({ exclusiveMinimum: 1, multipleOf: 2 }).template()).toEqual(
         2
      );
      expect(number({ default: 1 }).template()).toEqual(1);
      expect(number({ const: 1 }).template()).toEqual(1);
   });

   test("coerce", () => {
      expect(number().coerce("1")).toEqual(1);
      expect(number().coerce(1)).toEqual(1);
      expect(number().coerce(true)).toEqual(1);

      // custom coersion
      const schema = number({
         coerce: (v) => Number(v) * 2,
      });
      expect(schema.coerce("1")).toEqual(2);
   });
});
