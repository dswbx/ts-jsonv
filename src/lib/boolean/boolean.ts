import { $kind, type StaticConstEnum, type TSchema } from "../base";
import type { BooleanSchema } from "../types";

export interface TBoolean<S extends BooleanSchema>
   extends TSchema,
      BooleanSchema {
   [$kind]: "boolean";
   static: StaticConstEnum<S, boolean>;
   type: "boolean";
}

export const boolean = <const S extends BooleanSchema>(
   schema?: S
): TBoolean<S> => {
   return {
      type: "boolean",
      [$kind]: "boolean",
      ...schema,
   } as any;
};
