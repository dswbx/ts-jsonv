import {
   type StaticConstEnum,
   type TSchema,
   type TSchemaWithFn,
   create,
} from "../base";
import type { NumberSchema } from "../types";

export interface TNumber<S extends NumberSchema>
   extends TSchema<"number">,
      NumberSchema {
   static: StaticConstEnum<S, number>;
}

export const number = <const S extends TSchemaWithFn<NumberSchema>>(
   schema?: S
) =>
   create<TNumber<S>>("number", {
      coerce: (value) => Number(value),
      validate,
      template,
      ...schema,
      type: "number",
   });

export const integer = <const S extends TSchemaWithFn<NumberSchema>>(
   schema?: S
) =>
   create<TNumber<S>>("integer", {
      coerce: (value) => Number(value),
      validate,
      template,
      ...schema,
      type: "integer",
   });

function validate(this: NumberSchema, value: unknown): string | void {
   if (typeof value !== "number") {
      return "type";
   }

   if (this.multipleOf !== undefined && value % this.multipleOf !== 0) {
      return "multipleOf";
   }

   if (this.maximum !== undefined && value > this.maximum) {
      return "maximum";
   }

   if (this.exclusiveMaximum !== undefined && value >= this.exclusiveMaximum) {
      return "exclusiveMaximum";
   }

   if (this.minimum !== undefined && value < this.minimum) {
      return "minimum";
   }

   if (this.exclusiveMinimum !== undefined && value <= this.exclusiveMinimum) {
      return "exclusiveMinimum";
   }
}

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
