import { describe, expect, test } from "bun:test";
import * as s from "../";
import { schema } from "../schema";
import { fromSchema } from "../";
import { ref } from "../ref/ref";

describe("validate", () => {
   test("error count", () => {
      const result = s.string({ minLength: 10, pattern: "/a/" }).validate("b");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      expect(result.errors[1]?.keywordLocation).toBe("/pattern");
   });

   test("boolean schema", () => {
      const falsy = schema(false).validate(undefined);
      expect(falsy.valid).toBe(false);
      expect(falsy.errors.length).toBe(1);
      expect(falsy.errors[0]?.error).toBe("Always fails");

      const truthy = schema(true).validate(undefined);
      expect(truthy.valid).toBe(true);
      expect(truthy.errors.length).toBe(0);
   });

   test("multiple vs single errors", () => {
      const result = s
         .string({ minLength: 10, pattern: "^[0-9]+$" })
         .validate("what");

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      expect(result.errors[1]?.keywordLocation).toBe("/pattern");

      {
         const result = s
            .string({ minLength: 10, pattern: "^[0-9]+$" })
            .validate("what", {
               shortCircuit: true,
            });
         expect(result.valid).toBe(false);
         expect(result.errors.length).toBe(1);
         expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      }
   });

   test("multiple types", () => {
      const multi = fromSchema({ type: ["string", "number"] });
      expect(multi.validate("hello").valid).toBe(true);
      expect(multi.validate(1).valid).toBe(true);
      expect(multi.validate(true).errors[0]?.keywordLocation).toBe("/type");
   });

   test.only("ref", () => {
      const schema = s.object({
         foo: s.refId("#").optional(),
      });

      console.log(
         schema.validate(
            { foo: { foo: {} } },
            {
               ignoreUnsupported: true,
            }
         )
      );
      console.log(schema.toJSON());
   });

   test("collecting refs", () => {
      const schema = fromSchema({
         $defs: {
            fooSchema: {
               //type: "string",
               minLength: 2,
            },
         },
         properties: {
            foo: {
               $ref: "#/$defs/fooSchema",
            },
         },
      });
      console.log(schema);

      console.log("--------------------------------");
      console.log(
         schema.validate(
            { foo: "1" },
            {
               ignoreUnsupported: true,
            }
         )
      );
   });

   test.skip("validate", () => {
      {
         expect(s.string().validate("hello").valid).toBe(true);
         expect(s.string().validate(1).errors[0]?.keywordLocation).toBe(
            "/type"
         );
         expect(
            s.string({ minLength: 1 }).validate("").errors[0]?.keywordLocation
         ).toBe("/minLength");
         expect(s.string({ minLength: 1 }).validate("123").valid).toBe(true);
         expect(
            s.string({ maxLength: 1 }).validate("123").errors[0]
               ?.keywordLocation
         ).toBe("/maxLength");
         expect(
            s.string({ maxLength: 1 }).validate("1234").errors[0]
               ?.keywordLocation
         ).toBe("/maxLength");
         expect(s.string({ pattern: "^[0-9]+$" }).validate("123").valid).toBe(
            true
         );
         expect(
            s.string({ pattern: "^[0-9]+$" }).validate("abc").errors[0]
               ?.keywordLocation
         ).toBe("/pattern");
      }

      {
         expect(s.number().validate("123").errors[0]?.keywordLocation).toBe(
            "/type"
         );
         expect(
            s.number({ multipleOf: 2 }).validate(1).errors[0]?.keywordLocation
         ).toBe("/multipleOf");
         expect(s.number({ multipleOf: 2 }).validate(2).valid).toBe(true);
         expect(
            s.number({ multipleOf: 2 }).validate(3).errors[0]?.keywordLocation
         ).toBe("/multipleOf");
         expect(s.number({ maximum: 1 }).validate(0).valid).toBe(true);
         expect(
            s.number({ maximum: 1 }).validate(2).errors[0]?.keywordLocation
         ).toBe("/maximum");
         expect(
            s.number({ exclusiveMaximum: 1 }).validate(1).errors[0]
               ?.keywordLocation
         ).toBe("/exclusiveMaximum");
         expect(s.number({ minimum: 1 }).validate(1).valid).toBe(true);
         expect(
            s.number({ minimum: 1 }).validate(0).errors[0]?.keywordLocation
         ).toBe("/minimum");
         expect(
            s.number({ exclusiveMinimum: 1 }).validate(1).errors[0]
               ?.keywordLocation
         ).toBe("/exclusiveMinimum");
      }

      {
         // objects
         expect(
            s
               .object({
                  test: s.string({ minLength: 10 }),
               })
               .validate({
                  test: "123",
               })
         ).toEqual({
            valid: false,
            errors: [
               {
                  keywordLocation: "/properties/test/minLength",
                  instanceLocation: "/test",
                  error: "Expected string with minimum length of 10",
                  data: "123",
               },
            ],
         });

         expect(
            s
               .object({
                  nested: s.object({
                     test: s.string({ minLength: 10 }),
                  }),
               })
               .validate({
                  nested: {
                     test: "123",
                  },
               })
         ).toEqual({
            valid: false,
            errors: [
               {
                  keywordLocation:
                     "/properties/nested/properties/test/minLength",
                  instanceLocation: "/nested/test",
                  error: "Expected string with minimum length of 10",
                  data: "123",
               },
            ],
         });
      }
   });
});
