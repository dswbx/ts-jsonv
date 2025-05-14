import {
   type TCustomSchema,
   type TSchema,
   type TSchemaBase,
   schema,
} from "../schema";
import { type Static, type StaticCoersed } from "../static";

export type TRef<T extends TSchema> = TCustomSchema<TSchemaBase, Static<T>> & {
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
