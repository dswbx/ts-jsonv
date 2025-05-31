import type {
   TAnySchema,
   TCustomSchema,
   TCustomType,
   TSchema,
} from "../schema";
import { schema } from "../schema";
import { fromSchema } from "../schema/from-schema";
import type { Merge, Static, StaticCoerced } from "../static";
import { mergeAllOf } from "../utils/merge-allof";
import type { CoercionOptions } from "../validation/coerce";
import { matches } from "../validation/keywords";

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
         ? StaticUnionCoerced<Rest> | StaticCoerced<U>
         : StaticCoerced<U>
      : never
   : never;

export interface UnionSchema extends TCustomType {
   $defs?: Record<string, TSchema>;
}

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
         coerce: function (
            this: TAnyOf<T, O>,
            _value: unknown,
            opts: CoercionOptions = {}
         ) {
            let value = _value;
            if ("coerce" in options && options.coerce !== undefined) {
               return options.coerce.bind(this)(_value, opts);
            }

            const m = matches(schemas, value, {
               ignoreUnsupported: true,
               resolver: opts.resolver,
               coerce: true,
            });

            if (m.length > 0) {
               return m[0]!.coerce(value, opts);
            }
            return value;
         },
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
   const T extends TSchema[],
   const O extends Omit<TSchema, "oneOf">
>(
   schemas: T,
   options: O = {} as O
): TOneOf<T, O> => {
   return schema(
      {
         ...options,
         coerce: function (
            this: TOneOf<T, O>,
            value: unknown,
            opts: CoercionOptions = {}
         ) {
            const m = matches(schemas, value, {
               ignoreUnsupported: true,
               resolver: opts.resolver,
               coerce: true,
            });

            if (m.length === 1) {
               return m[0]!.coerce(value, opts);
            }
            return value;
         },
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
