import {
   schema,
   type TCustomSchema,
   type TSchemaBase,
   type TSchemaFn,
} from "../schema";

export interface NumberSchema extends TSchemaBase, Partial<TSchemaFn> {
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;
}

export type TNumber<O extends NumberSchema> = TCustomSchema<O, number>;

/* export interface TNumber<O extends NumberSchema>
   extends TSchema<number>,
      TSchemaFn {
   static: StaticConstEnum<O, number>;
}*/

export const number = <const S extends NumberSchema>(
   config: S = {} as S
): TNumber<S> =>
   schema(
      {
         coerce: (value: unknown) => Number(value),
         template,
         ...config,
         type: "number",
      },
      "number"
   ) as any;

export const integer = <const S extends NumberSchema>(
   config: S = {} as S
): TNumber<S> =>
   schema(
      {
         coerce: (value: unknown) => Number(value),
         template,
         ...config,
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
