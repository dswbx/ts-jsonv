import {
   type StaticConstEnum,
   type TSchema,
   type TSchemaWithFn,
   create,
} from "../base";
import type { StringSchema } from "../types";
import { matchesPattern } from "../utils";

export interface TString<S extends StringSchema = StringSchema>
   extends TSchema<"string">,
      StringSchema {
   static: StaticConstEnum<S, string>;
}

export const string = <const S extends TSchemaWithFn<StringSchema>>(
   schema?: S
) =>
   create<TString<S>>("string", {
      template: () => "",
      coerce: (value) => String(value),
      validate,
      ...schema,
      type: "string",
   });

export const stringConst = <const S extends TSchemaWithFn<StringSchema>>(
   schema: S
) =>
   create<TString<S>>("string", {
      validate,
      template: () => "",
      coerce: (value) => String(value),
      ...schema,
      type: "string",
      const: schema.const,
      default: schema.const,
      readOnly: true,
   });

function validate(this: StringSchema, value: unknown): string | void {
   if (typeof value !== "string") {
      return "type";
   }

   if (this.pattern && !matchesPattern(this.pattern, value)) {
      return "pattern";
   }

   if (this.minLength !== undefined && value.length < this.minLength) {
      return "minLength";
   }

   if (this.maxLength !== undefined && value.length > this.maxLength) {
      return "maxLength";
   }

   // @todo: format
   // @todo: contentMediaType
   // @todo: contentEncoding
   const todo = ["format", "contentMediaType", "contentEncoding"];
   for (const item of todo) {
      if (this[item]) {
         throw new Error(`${item} not implemented`);
      }
   }
}
