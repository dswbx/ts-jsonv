import { $kind, type StaticConstEnum, type TSchema, create } from "../base";
import type { BooleanSchema } from "../types";

export interface TBoolean<S extends BooleanSchema>
   extends TSchema<"boolean">,
      BooleanSchema {
   static: StaticConstEnum<S, boolean>;
}

export const boolean = <const S extends BooleanSchema>(schema?: S) =>
   create<TBoolean<S>>("boolean", {
      ...schema,
      type: "boolean",
      validate: function (this: BooleanSchema, v: unknown) {
         if (typeof v !== "boolean") {
            return "type";
         }
      },
   });
