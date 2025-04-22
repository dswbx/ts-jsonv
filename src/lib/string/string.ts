import { $kind, type StaticConstEnum, type TSchema } from "../base";
import type { StringSchema } from "../types";

export interface TString<S extends StringSchema = StringSchema>
   extends TSchema,
      StringSchema {
   [$kind]: "string";
   static: StaticConstEnum<S, string>;
   type: "string";
}

export const string = <const S extends StringSchema = StringSchema>(
   schema?: S
): TString<S> => {
   return {
      type: "string",
      [$kind]: "string",
      ...schema,
      validate,
   } as any;
};

export const stringConst = <const S extends StringSchema = StringSchema>(
   schema: S
): TString<S> => {
   return {
      type: "string",
      [$kind]: "string",
      ...schema,
      const: schema.const,
      default: schema.const,
      readOnly: true,
      validate,
   } as any;
};

function validate(this: StringSchema, value: unknown): string | void {
   if (typeof value !== "string") {
      return "type";
   }

   if (this.const !== undefined && this.const !== value) {
      return "const";
   }

   if (this.enum && !this.enum.includes(value)) {
      return "enum";
   }

   if (this.pattern) {
      const match = this.pattern.match(/^\/(.+)\/([gimuy]*)$/);
      const [, p, f] = match || [null, this.pattern, ""];
      if (!new RegExp(p, f).test(value)) {
         return "pattern";
      }
   }

   if (this.minLength !== undefined && value.length < this.minLength) {
      return "minLength";
   }

   if (this.maxLength !== undefined && value.length > this.maxLength) {
      return "maxLength";
   }
}
