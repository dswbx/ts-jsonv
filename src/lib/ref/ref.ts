import {
   type TCustomSchema,
   type TSchema,
   type TSchemaBase,
   schema,
} from "../schema";
import { type Static } from "../static";

export type TRef<T extends TSchema> = TCustomSchema<TSchemaBase, Static<T>> & {
   $ref: string;
};

export const ref = <T extends TSchema>(
   ref: T,
   prefix: "$defs" | "definitions" = "$defs"
): TRef<T> => {
   if (!ref.$id) {
      throw new Error("Schema must have a $id");
   }

   return schema(
      {
         $ref: `#/${prefix}/${ref.$id}`,
      },
      "ref"
   );
};
