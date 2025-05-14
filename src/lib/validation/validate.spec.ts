import { describe, expect, test } from "bun:test";
import { validate } from "./validate";
import * as s from "../";
import { schema } from "../schema";

describe("validate", () => {
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
      const result = validate(
         s.string({ minLength: 10, pattern: "^[0-9]+$" }),
         "what"
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      expect(result.errors[1]?.keywordLocation).toBe("/pattern");

      {
         const result = validate(
            s.string({ minLength: 10, pattern: "^[0-9]+$" }),
            "what",
            {
               shortCircuit: true,
            }
         );
         expect(result.valid).toBe(false);
         expect(result.errors.length).toBe(1);
         expect(result.errors[0]?.keywordLocation).toBe("/minLength");
      }
   });

   test("multiple types", () => {
      const multi = schema({ type: ["string", "number"] });
      expect(multi.validate("hello").valid).toBe(true);
      expect(multi.validate(1).valid).toBe(true);
      expect(multi.validate(true).errors[0]?.keywordLocation).toBe("/type");
   });

   test.skip("validate", () => {
      {
         expect(validate(s.string(), "hello").valid).toBe(true);
         expect(validate(s.string(), 1).errors[0]?.keywordLocation).toBe(
            "/type"
         );
         expect(
            validate(s.string({ minLength: 1 }), "").errors[0]?.keywordLocation
         ).toBe("/minLength");
         expect(validate(s.string({ minLength: 1 }), "123").valid).toBe(true);
         expect(
            validate(s.string({ maxLength: 1 }), "123").errors[0]
               ?.keywordLocation
         ).toBe("/maxLength");
         expect(
            validate(s.string({ maxLength: 1 }), "1234").errors[0]
               ?.keywordLocation
         ).toBe("/maxLength");
         expect(validate(s.string({ pattern: "^[0-9]+$" }), "123").valid).toBe(
            true
         );
         expect(
            validate(s.string({ pattern: "^[0-9]+$" }), "abc").errors[0]
               ?.keywordLocation
         ).toBe("/pattern");
      }

      {
         expect(validate(s.number(), "123").errors[0]?.keywordLocation).toBe(
            "/type"
         );
         expect(
            validate(s.number({ multipleOf: 2 }), 1).errors[0]?.keywordLocation
         ).toBe("/multipleOf");
         expect(validate(s.number({ multipleOf: 2 }), 2).valid).toBe(true);
         expect(
            validate(s.number({ multipleOf: 2 }), 3).errors[0]?.keywordLocation
         ).toBe("/multipleOf");
         expect(validate(s.number({ maximum: 1 }), 0).valid).toBe(true);
         expect(
            validate(s.number({ maximum: 1 }), 2).errors[0]?.keywordLocation
         ).toBe("/maximum");
         expect(
            validate(s.number({ exclusiveMaximum: 1 }), 1).errors[0]
               ?.keywordLocation
         ).toBe("/exclusiveMaximum");
         expect(validate(s.number({ minimum: 1 }), 1).valid).toBe(true);
         expect(
            validate(s.number({ minimum: 1 }), 0).errors[0]?.keywordLocation
         ).toBe("/minimum");
         expect(
            validate(s.number({ exclusiveMinimum: 1 }), 1).errors[0]
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
