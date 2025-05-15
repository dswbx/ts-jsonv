import type {
   TAnySchema,
   TCustomSchema,
   TSchema,
   TSchemaBase,
   TSchemaFn,
} from "../schema";
import { schema } from "../schema";
import { fromSchema } from "../schema/from-schema";
import type { Merge, Static, StaticCoersed } from "../static";
import { mergeAllOf } from "../utils/merge-allof";

type StaticUnion<T extends TAnySchema[]> = T extends [infer U, ...infer Rest]
   ? U extends TAnySchema
      ? Rest extends TAnySchema[]
         ? StaticUnion<Rest> | Static<U>
         : Static<U>
      : never
   : never;

type StaticUnionCoerced<T extends TAnySchema[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends TAnySchema
      ? Rest extends TAnySchema[]
         ? StaticUnionCoerced<Rest> | StaticCoersed<U>
         : StaticCoersed<U>
      : never
   : never;

export interface UnionSchema extends Partial<TSchema> {}

export type TAnyOf<
   T extends TAnySchema[],
   O extends UnionSchema = UnionSchema
> = TCustomSchema<O, StaticUnion<T>> & {
   static: StaticUnion<T>;
   coerce: StaticUnionCoerced<T>;
   anyOf: T;
};

export const anyOf = <
   const T extends TSchema[],
   const O extends Omit<UnionSchema, "anyOf">
>(
   schemas: T,
   options: O = {} as O
): TAnyOf<T, O> => {
   return schema(
      {
         ...options,
         anyOf: schemas,
      },
      "anyOf"
   ) as any;
};

export type TOneOf<
   T extends TAnySchema[],
   O extends UnionSchema = UnionSchema
> = TCustomSchema<O, StaticUnion<T>> & {
   static: StaticUnion<T>;
   oneOf: T;
};

export const oneOf = <
   const T extends TAnySchema[],
   const O extends Omit<TSchema, "oneOf">
>(
   schemas: T,
   options: O = {} as O
): TOneOf<T, O> => {
   return schema(
      {
         ...options,
         oneOf: schemas,
      },
      "oneOf"
   ) as any;
};

type StaticUnionAllOf<T extends TAnySchema[]> = T extends [
   infer U,
   ...infer Rest
]
   ? U extends TAnySchema
      ? Rest extends TAnySchema[]
         ? Merge<U["static"] & StaticUnionAllOf<Rest>>
         : U["static"]
      : never
   : {};

export type TAllOf<
   T extends TAnySchema[],
   O extends UnionSchema = UnionSchema
> = TCustomSchema<O, StaticUnionAllOf<T>> & {
   static: StaticUnionAllOf<T>;
   allOf: T;
};

// use with caution!
export const allOf = <
   const T extends TAnySchema[],
   const O extends Omit<TSchema, "allOf">
>(
   schemas: T,
   options: O = {} as O
): TAllOf<T, O> => {
   const clone = JSON.parse(
      JSON.stringify({
         ...options,
         allOf: schemas,
      })
   );

   return fromSchema(mergeAllOf(clone)) as any;
};
