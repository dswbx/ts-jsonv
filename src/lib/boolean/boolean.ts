import {
   type TCustomSchema,
   type TSchemaBase,
   type TSchemaFn,
   schema,
} from "../schema";

export interface BooleanSchema extends TSchemaBase, Partial<TSchemaFn> {}

export type TBoolean<O extends BooleanSchema> = TCustomSchema<O, boolean>;

export const boolean = <const S extends BooleanSchema>(
   options: S = {} as S
): TBoolean<S> =>
   schema<boolean, S>(
      {
         coerce: (value) => Boolean(value),
         ...options,
         type: "boolean",
      },
      "boolean"
   ) as any;
