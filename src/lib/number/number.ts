import { schema, type TCustomSchema, type TSchema } from "../schema";
import { isString } from "../utils";

export interface NumberSchema extends Partial<TSchema> {
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;
}

export type TNumber<O extends NumberSchema> = TCustomSchema<O, number>;

export const number = <const S extends NumberSchema>(
   options: S = {} as S
): TNumber<S> =>
   schema(
      {
         coerce: (value: unknown) => {
            if (isString(value)) return Number(value);
            return value;
         },
         template,
         ...options,
         type: "number",
      },
      "number"
   ) as any;

export const integer = <const S extends NumberSchema>(
   options: S = {} as S
): TNumber<S> =>
   schema(
      {
         coerce: (value: unknown) => {
            if (isString(value)) return Number.parseInt(value);
            return value;
         },
         template,
         ...options,
         type: "integer",
      },
      "integer"
   ) as any;

function template(this: NumberSchema) {
   if (this.minimum) return this.minimum;
   if (this.exclusiveMinimum) {
      if (this.multipleOf) {
         let result = this.exclusiveMinimum;
         while (result % this.multipleOf !== 0) {
            result++;
         }
         return result;
      }
      return this.exclusiveMinimum + 1;
   }
   return 0;
}
