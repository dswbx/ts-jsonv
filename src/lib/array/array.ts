import {
   type TSchemaBase,
   type TSchemaFn,
   schema,
   type TAnySchema,
   type TCustomSchema,
} from "../schema";
import type { Static } from "../static";
import { isSchema, invariant, isBoolean } from "../utils";

type ArrayStatic<T extends TAnySchema> = Static<T>[] & {};

export interface ArraySchema extends TSchemaBase, Partial<TSchemaFn> {
   contains?: TAnySchema;
   minContains?: number;
   maxContains?: number;
   prefixItems?: TAnySchema[];
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
}

type TArray<Items extends TAnySchema, O extends ArraySchema> = TCustomSchema<
   O,
   ArrayStatic<Items>
> & {
   items: Items;
};

export const array = <
   const Items extends TAnySchema,
   const O extends ArraySchema
>(
   items: Items | boolean,
   options: O = {} as O
): TArray<Items, O> => {
   if (items !== undefined) {
      invariant(isSchema(items), "items must be a schema", items);
   }

   return schema(
      {
         template: () => [],
         coerce,
         ...options,
         type: "array",
         items,
      } as any,
      "array"
   );
};

function coerce(
   this: ArraySchema & { items: TAnySchema | boolean },
   _value: unknown
) {
   const value = typeof _value === "string" ? JSON.parse(_value) : _value;
   if (!Array.isArray(value)) {
      return undefined;
   }

   if (!isBoolean(this.items)) {
      for (const [index, item] of value.entries()) {
         // @ts-ignore
         value[index] = this.items.coerce(item);
      }
   }

   return value;
}
