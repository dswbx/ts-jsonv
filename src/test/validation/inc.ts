import * as s from "../../lib";
import Ajv from "ajv";
import { compileSchema } from "json-schema-library";
import { Validator } from "@cfworker/json-schema";

export const schemas = [
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

export const validators: {
   name: string;
   validate: (schema: s.TSchema, data: unknown) => boolean;
}[] = [
   {
      name: "@cfworker/json-schema",
      validate: (schema, data) => {
         return new Validator(schema.toJSON()).validate(data).valid;
      },
   },
   {
      name: "ajv (jit)",
      validate: (schema, data) => {
         const ajv = new Ajv();
         return ajv.validate(schema.toJSON(), data);
      },
   },
   {
      name: "json-schema-library",
      validate: (schema, data) => {
         return compileSchema(schema.toJSON()).validate(data).valid;
      },
   },
   {
      name: "jsonv-ts",
      validate: (schema, data) => {
         return schema.validate(data).valid;
      },
   },
] as const;
