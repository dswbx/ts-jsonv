import { $kind, type Static, type TSchema } from "../base";
import type { ArraySchema } from "../types";
export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ArrayStatic<T extends TSchema> = Static<T>[] & {};

export interface TArray<T extends TSchema> extends TSchema {
   type: "array";
   items: T;
   static: ArrayStatic<T>;
}

export const array = <
   const T extends TSchema,
   O extends Omit<ArraySchema, "items">
>(
   items: T,
   options?: O
): TArray<T> => {
   return {
      type: "array",
      items,
      [$kind]: "array",
      ...options,
   } as any;
};
