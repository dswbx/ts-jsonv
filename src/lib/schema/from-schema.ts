import type { JSONSchemaDefinition } from "../types";
import * as lib from "..";
import { isObject, isNonBooleanSchema, isTypeSchema } from "../utils";

function eachArray<T>(array: any | any[], fn: (item: any) => T): T[] {
   return Array.isArray(array)
      ? array.map(fn)
      : array !== undefined
      ? [fn(array)]
      : [];
}

function eachObject<T>(
   object: Record<string, any>,
   fn: (item: any) => T
): Record<string, T> {
   return Object.fromEntries(
      Object.entries(object).map(([key, value]) => [key, fn(value)])
   );
}

export function fromSchema(schema: JSONSchemaDefinition): lib.TSchema<any> {
   if (!isNonBooleanSchema(schema)) {
      throw new Error("boolean schemas not implemented");
   }
   if (!isObject(schema)) {
      throw new Error("non-object schemas not implemented");
   }

   if (isTypeSchema(schema)) {
      switch (schema.type) {
         case "string":
            return lib.string(schema);
         case "number":
            return lib.number(schema);
         case "integer":
            return lib.integer(schema);
         case "boolean":
            return lib.boolean(schema);
         case "object": {
            const { properties, additionalProperties, ...rest } = schema;
            return lib.object(
               properties ? eachObject(properties, fromSchema) : {},
               {
                  ...rest,
                  additionalProperties: additionalProperties
                     ? fromSchema(additionalProperties)
                     : undefined,
               }
            );
         }
         case "array": {
            const { items, ...rest } = schema;
            if (!isTypeSchema(items)) {
               throw new Error("array items must be a type schema");
            }

            return lib.array(fromSchema(items), rest);
         }
         case "null":
            throw new Error("null schemas not implemented");
      }
   }

   const unions = ["anyOf", "oneOf", "allOf"];
   for (const union of unions) {
      if (union in schema) {
         const { [union]: _schemas, ...rest } = schema;
         return lib[union](eachArray(_schemas, fromSchema), rest);
      }
   }

   console.log("schema", schema);
   throw new Error("unknown schema");
}
