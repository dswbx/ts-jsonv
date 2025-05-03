import { $kind, type StaticConstEnum, type TSchema, create } from "../base";
import type { StringSchema } from "../types";

export interface TString<S extends StringSchema = StringSchema>
   extends TSchema<"string">,
      StringSchema {
   static: StaticConstEnum<S, string>;
}

export const string = <const S extends StringSchema = StringSchema>(
   schema?: S
) =>
   create<TString<S>>("string", {
      ...schema,
      type: "string",
      validate,
      template: () => "",
   });

export const stringConst = <const S extends StringSchema = StringSchema>(
   schema: S
) =>
   create<TString<S>>("string", {
      ...schema,
      type: "string",
      const: schema.const,
      default: schema.const,
      readOnly: true,
      validate,
      template: () => "",
   });

function validate(this: StringSchema, value: unknown): string | void {
   if (typeof value !== "string") {
      return "type";
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

   // @todo: format
   // @todo: contentMediaType
   // @todo: contentEncoding
}
