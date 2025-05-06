import { $kind, type TSchema } from "../base";
import type {
   BaseJSONSchema,
   PropertyName,
   JSONSchemaDefinition,
} from "../types";

export function isObject(value: unknown): value is Record<string, unknown> {
   return typeof value === "object" && value !== null;
}

export function isValidPropertyName(value: unknown): value is PropertyName {
   return typeof value === "string" && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value);
}

export function isNonBooleanSchema(
   schema: unknown
): schema is Exclude<JSONSchemaDefinition, boolean> {
   return typeof schema !== "boolean";
}

export function isTypeSchema(schema: unknown): schema is BaseJSONSchema {
   return isNonBooleanSchema(schema) && "type" in schema;
}

export function isSchema(schema: unknown): schema is TSchema {
   return isNonBooleanSchema(schema) && $kind in schema;
}

export function matchesPattern(pattern: string, value: string): boolean {
   const match = pattern.match(/^\/(.+)\/([gimuy]*)$/);
   const [, p, f] = match || [null, pattern, ""];
   return new RegExp(p, f).test(value);
}

export function invariant(
   condition: boolean,
   message: string
): asserts condition {
   if (!condition) {
      throw new Error(message);
   }
}
