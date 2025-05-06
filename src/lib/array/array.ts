import {
   $kind,
   type Static,
   type TSchema,
   type TSchemaWithFn,
   create,
} from "../base";
import type { ArraySchema } from "../types";
import { isSchema, invariant } from "../utils";

export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ArrayStatic<T extends TSchema> = Static<T>[] & {};

export interface TArray<T extends TSchema> extends TSchema<"array"> {
   items: T;
   static: ArrayStatic<T>;
}

export const array = <
   const T extends TSchema,
   O extends TSchemaWithFn<Omit<ArraySchema, "items">>
>(
   items: T,
   options?: O
) => {
   invariant(isSchema(items), "items must be a schema");

   return create<TArray<T>>("array", {
      validate,
      template: () => [],
      coerce,
      ...options,
      type: "array",
      items,
      [$kind]: "array",
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

   const todo = ["uniqueItems", "contains", "minContains", "maxContains"];
   for (const item of todo) {
      if (this[item]) {
         throw new Error(`${item} not implemented`);
      }
   }

   // @todo: uniqueItems
   // @todo: contains
   // @todo: minContains
   // @todo: maxContains
}

function coerce(this: ArraySchema, _value: unknown) {
   const value = typeof _value === "string" ? JSON.parse(_value) : _value;
   if (!Array.isArray(value)) {
      return undefined;
   }

   if (this.items) {
      for (const [index, item] of value.entries()) {
         // @ts-ignore
         value[index] = this.items.coerce(item);
      }
   }

   return value;
}
