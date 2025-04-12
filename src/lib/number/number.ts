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
   } as any;
};

export const integer = <const S extends NumberSchema>(
   schema?: S
): TNumber<S> => {
   return {
      type: "integer",
      [$kind]: "integer",
      ...schema,
   } as any;
};
