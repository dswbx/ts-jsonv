import {
   schema,
   type TAnySchema,
   type TCustomSchema,
   type TSchema,
} from "../schema";
import type { Static, StaticCoersed } from "../static";
import { isSchema, invariant, isBoolean } from "../utils";

type ArrayStatic<T extends TAnySchema> = Static<T>[] & {};
type ArrayCoerced<T extends TAnySchema> = StaticCoersed<T>[] & {};

export interface ArraySchema extends Omit<Partial<TSchema>, "items"> {
   contains?: TSchema;
   minContains?: number;
   maxContains?: number;
   prefixItems?: TSchema[];
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
}

type TArray<Items extends TSchema, O extends ArraySchema> = TCustomSchema<
   O,
   ArrayStatic<Items>
> & {
   items: Items;
   coerce: (value: unknown) => ArrayCoerced<Items>;
};

export const array = <const Items extends TSchema, const O extends ArraySchema>(
   items: Items,
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
      },
      "array"
   ) as any;
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
