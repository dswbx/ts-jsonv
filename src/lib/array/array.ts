import { $kind, type Static, type TSchema, create } from "../base";
import type { ArraySchema } from "../types";

export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ArrayStatic<T extends TSchema> = Static<T>[] & {};

export interface TArray<T extends TSchema> extends TSchema<"array"> {
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
   return create<TArray<T>>("array", {
      ...options,
      type: "array",
      items,
      [$kind]: "array",
      validate,
      template: () => [],
   });
};

function validate(this: ArraySchema, value: unknown): string | void {
   if (!Array.isArray(value)) {
      return "type";
   }

   if (this.minItems !== undefined && value.length < this.minItems) {
      return "minItems";
   }

   if (this.maxItems !== undefined && value.length > this.maxItems) {
      return "maxItems";
   }

   if (this.items) {
      for (const item of value) {
         // @ts-ignore
         const error = this.items.validate(item);
         if (error) {
            return error;
         }
      }
   }

   if (this.additionalItems) {
      for (const item of value) {
         // @ts-ignore
         const error = this.additionalItems.validate(item);
         if (error) {
            return error;
         }
      }
   }
}
