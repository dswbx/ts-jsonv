import { Validator } from "@cfworker/json-schema";
import * as s from "../lib";
import { describe, expect, test } from "bun:test";
import Ajv from "ajv";
import { compileSchema } from "json-schema-library";

const schemas = [
   {
      name: "simple object",
      schema: s.object({
         name: s.string(),
      }),
      data: [
         [{ name: "John" }, true],
         [{ name: 1 }, false],
      ],
   },
   {
      name: "object with optional",
      schema: s.object({
         name: s.string().optional(),
         age: s.number({ minimum: 18 }),
      }),
      data: [
         [{ name: "John", age: 20 }, true],
         [{ name: "John", age: 17 }, false],
         [{ age: 18 }, true],
         [{}, false],
      ],
   },
] as const;

const validators: {
   name: string;
   validate: (schema: object, data: any) => boolean;
}[] = [
   {
      name: "@cfworker/json-schema",
      validate: (schema: object, data: any) => {
         return new Validator(schema).validate(data).valid;
      },
   },
   {
      name: "ajv",
      validate: (schema: object, data: any) => {
         const ajv = new Ajv();
         return ajv.validate(schema, data);
      },
   },
   {
      name: "json-schema-library",
      validate: (schema: object, data: any) => {
         return compileSchema(schema).validate(data).valid;
      },
   },
] as const;

describe("validation", () => {
   test("readme", () => {
      const UserSchema = s.object({
         id: s.number(),
         username: s.string({ minLength: 3 }),
         email: s.string({ format: "email" }).optional(),
      });

      const result = UserSchema.validate({ id: 1 });
      //console.log(JSON.stringify(result, null, 2));
   });

   for (const { name, validate } of validators) {
      describe(name, () => {
         for (const { name, schema, data } of schemas) {
            test(name, () => {
               for (const [_data, valid] of data) {
                  const result = validate(schema.toJSON(), _data);
                  expect(result).toBe(valid);
               }
            });
         }
      });
   }
});
