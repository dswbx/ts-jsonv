import { type TCustomSchema, type TCustomType, schema } from "../schema";
import { isNumber, isString } from "../utils";

export interface BooleanSchema extends TCustomType {}

export type TBoolean<O extends BooleanSchema> = TCustomSchema<O, boolean>;

export const boolean = <const S extends BooleanSchema>(
   options: S = {} as S
): TBoolean<S> =>
   schema(
      {
         ...options,
         coerce: function (value) {
            if ("coerce" in options && options.coerce) {
               return options.coerce(value);
            }
            if (
               isString(value) &&
               ["true", "false", "1", "0"].includes(value)
            ) {
               return value === "true" || value === "1";
            }
            if (isNumber(value)) {
               if (value === 1) return true;
               if (value === 0) return false;
            }

            return value;
         },
         type: "boolean",
      },
      "boolean"
   ) as any;
