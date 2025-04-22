import { $kind, type StaticConstEnum, type TSchema } from "../base";
import type { NumberSchema } from "../types";

export interface TNumber<S extends NumberSchema> extends TSchema, NumberSchema {
   [$kind]: "number";
   static: StaticConstEnum<S, number>;
   type: "number";
}

export const number = <const S extends NumberSchema>(
   schema?: S
): TNumber<S> => {
   return {
      type: "number",
      [$kind]: "number",
      ...schema,
      validate,
   } as any;
};

export const integer = <const S extends NumberSchema>(
   schema?: S
): TNumber<S> => {
   return {
      type: "integer",
      [$kind]: "integer",
      ...schema,
      validate,
   } as any;
};

function validate(this: NumberSchema, value: unknown): string | void {
   if (typeof value !== "number") {
      return "type";
   }

   if (this.const !== undefined && this.const !== value) {
      return "const";
   }

   if (this.enum && !this.enum.includes(value)) {
      return "enum";
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
