import {
   type TCustomSchema,
   type TSchema,
   type TSchemaBase,
   schema,
} from "../schema";
import { type Static, type StaticCoersed } from "../static";
import type { CoercionOptions } from "../validation/coerse";

export type TRef<T extends TSchema> = TCustomSchema<
   Omit<TSchemaBase, "ref">,
   Static<T>
> & {
   $ref: string;
   coerce: (value: unknown) => StaticCoersed<T>;
};

interface TRefSchema extends TSchema {
   $id: string;
}

export const ref = <T extends TRefSchema>(ref: T, $ref?: string): TRef<T> => {
   if (!ref.$id) {
      throw new Error("Schema must have an $id");
   }

   return schema(
      {
         $ref: $ref ?? ref.$id,
         coerce: function (this: TRef<T>, value, opts: CoercionOptions = {}) {
            return ref.coerce(value, opts);
         },
      },
      "ref"
   ) as any;
};

export type TRefId<Type = unknown, Id extends string = string> = TCustomSchema<
   Omit<TSchemaBase, "ref">,
   Type
> & {
   $ref: Id;
   coerce: (value: unknown) => Type;
};

export const refId = <const Type = unknown, const Id extends string = string>(
   $ref: Id
): TRefId<Type, Id> => {
   return schema(
      {
         $ref,
         coerce: function (
            this: TRefId<Type, Id>,
            value,
            opts: CoercionOptions = {}
         ) {
            try {
               return opts.resolver?.resolve(this.$ref).coerce(value, opts);
            } catch (e) {
               return value;
            }
         },
      },
      "ref"
   ) as any;
};
