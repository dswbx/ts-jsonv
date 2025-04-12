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
   } as any;
};
