import { type TCustomSchema, type TSchema, schema } from "../schema";

export interface BooleanSchema extends Partial<TSchema> {}

export type TBoolean<O extends BooleanSchema> = TCustomSchema<O, boolean>;

export const boolean = <const S extends BooleanSchema>(
   options: S = {} as S
): TBoolean<S> =>
   schema(
      {
         ...options,
         coerce: options.coerce ?? ((value) => Boolean(value)),
         type: "boolean",
      },
      "boolean"
   ) as any;
