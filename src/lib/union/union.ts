import type { TAnySchema, TSchema, TSchemaBase } from "../schema";
import { schema } from "../schema";
import { fromSchema } from "../schema/from-schema";
import type { Merge } from "../static";
import { mergeAllOf } from "../utils/merge-allof";

type StaticUnion<T extends TAnySchema[]> = T extends [infer U, ...infer Rest]
   ? U extends TAnySchema
      ? Rest extends TAnySchema[]
         ? StaticUnion<Rest> | U["static"]
         : U["static"]
      : never
   : never;

export const anyOf = <
   const T extends TAnySchema[],
   const O extends Omit<TSchemaBase, "anyOf">
>(
   schemas: T,
   options: O = {} as O
) => {
   return schema<StaticUnion<T>, O & { anyOf: T }>(
      {
         ...options,
         anyOf: schemas,
      },
      "anyOf"
   );
};

export const oneOf = <
   const T extends TAnySchema[],
   const O extends Omit<TSchemaBase, "oneOf">
>(
   schemas: T,
   options: O = {} as O
) => {
   return schema<StaticUnion<T>, O & { oneOf: T }>(
      {
         ...options,
         oneOf: schemas,
      },
      "oneOf"
   );
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

// use with caution!
export const allOf = <
   const T extends TAnySchema[],
   const O extends Omit<TSchemaBase, "allOf">
>(
   schemas: T,
   options: O = {} as O
) => {
   const clone = JSON.parse(
      JSON.stringify({
         ...options,
         allOf: schemas,
      })
   );

   return fromSchema(mergeAllOf(clone)) as unknown as TSchema<
      StaticUnionAllOf<T>
   >;
};
