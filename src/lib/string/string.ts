import {
   schema,
   type TCustomSchema,
   type TSchemaBase,
   type TSchemaFn,
} from "../schema";
import type { Merge, Simplify } from "../static";

export interface StringSchema extends TSchemaBase, Partial<TSchemaFn> {
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;
}

export type TString<O extends StringSchema> = TCustomSchema<O, string>;

/* export type TString<O extends StringSchema> = {
   static: StaticConstEnum<O, string>;
} & {
   [K in keyof O]: O[K];
} & TSchemaFn; */

/* export interface TString<O extends StringSchema>
   extends TSchema<string>,
      TSchemaFn {
   static: StaticConstEnum<O, string>;
}*/

export const string = <const S extends StringSchema = StringSchema>(
   config: S = {} as S
): TString<S> =>
   schema(
      {
         template: () => "",
         coerce: (value: unknown) => String(value),
         ...config,
         type: "string",
      },
      "string"
   ) as any;

export const stringConst = <
   const ConstValue extends string = string,
   const S extends StringSchema = StringSchema
>(
   constValue: ConstValue,
   config: Partial<S> = {}
): TString<Simplify<Merge<S & { const: ConstValue }>>> =>
   schema({
      const: constValue,
      default: constValue,
      readOnly: true,
      template: () => constValue,
      coerce: (value: unknown) => String(value),
      ...config,
      type: "string",
   }) as any;
