import { $kind, type TSchema } from "../base";

export const ref = <T extends TSchema>(
   schema: T,
   prefix: "$defs" | "definitions" = "$defs"
): T => {
   if (!schema.$id) {
      throw new Error("Schema must have a $id");
   }

   return {
      $ref: `#/${prefix}/${schema.$id}`,
      [$kind]: "ref",
   } as any;
};
