import {
   type TCustomSchema,
   type TSchema,
   type TSchemaBase,
   schema,
} from "../schema";
import { type Static, type StaticCoersed } from "../static";

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

export const ref = <T extends TRefSchema>(
   ref: T,
   prefix: "$defs" | "definitions" = "$defs"
): TRef<T> => {
   if (!ref.$id) {
      throw new Error("Schema must have an $id");
   }

   return schema(
      {
         $ref: `#/${prefix}/${ref.$id}`,
      },
      "ref"
   ) as any;
};

export type TRefId<
   Type = unknown,
   Id extends string = string,
   Ref extends string = Id extends `#${infer _}` ? Id : `#/$defs/${Id}`
> = TCustomSchema<Omit<TSchemaBase, "ref">, Type> & {
   $ref: Ref;
   coerce: (value: unknown) => Type;
};

export const refId = <const Type = unknown, const Id extends string = string>(
   $id: Id
): TRefId<Type, Id> => {
   const $ref = $id.startsWith("#") ? $id : `#/$defs/${$id}`;
   return schema(
      {
         $ref,
      },
      "ref"
   ) as any;
};
