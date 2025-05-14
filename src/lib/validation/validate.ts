import type { TSchema } from "../schema";
import { error, valid, type ErrorDetail } from "../utils/details";
import {
   _type,
   _const,
   _enum,
   maxLength,
   minLength,
   pattern,
   multipleOf,
   maximum,
   minimum,
   exclusiveMaximum,
   exclusiveMinimum,
   required,
   minProperties,
   maxProperties,
   minItems,
   maxItems,
   uniqueItems,
   contains,
   prefixItems,
   items,
   additionalProperties,
   patternProperties,
   properties,
   propertyNames,
   allOf,
   anyOf,
   oneOf,
   not,
   dependentRequired,
   dependentSchemas,
   ifThenElse,
} from "./keywords";
import { format } from "./format";

type TKeywordFn = (
   schema: TSchema,
   value: unknown,
   opts: Omit<ValidationOptions, "coerce">
) => ValidationResult;

export const keywords: Record<string, TKeywordFn> = {
   type: _type,
   const: _const,
   enum: _enum,
   allOf,
   anyOf,
   oneOf,
   not,
   minLength,
   maxLength,
   pattern,
   format,
   minimum,
   exclusiveMinimum,
   maximum,
   exclusiveMaximum,
   multipleOf,
   required,
   dependentRequired,
   dependentSchemas,
   minProperties,
   maxProperties,
   propertyNames,
   properties,
   patternProperties,
   additionalProperties,
   minItems,
   maxItems,
   uniqueItems,
   contains,
   prefixItems,
   items,
   if: ifThenElse,
};

export type ValidationOptions = {
   keywordPath?: string[];
   instancePath?: string[];
   coerce?: boolean;
   errors?: ErrorDetail[];
   shortCircuit?: boolean;
};

export type ValidationResult = {
   valid: boolean;
   errors: ErrorDetail[];
};

export function validate(
   s: TSchema,
   _value: unknown,
   opts: ValidationOptions = {}
): ValidationResult {
   let errors: ErrorDetail[] = opts?.errors || [];
   const value = opts?.coerce ? s.coerce(_value) : _value;

   const todo = [
      //"readOnly",
      "$ref",
      "$defs",
   ];
   for (const item of todo) {
      if (s[item]) {
         throw new Error(`${item} not implemented`);
      }
   }
   // @todo: readOnly
   // @todo: $ref
   // @todo: $defs

   for (const [keyword, validator] of Object.entries(keywords)) {
      if (s[keyword] === undefined) continue;
      const result = validator(s, value, {
         ...opts,
         errors,
      });
      if (!result.valid) {
         if (opts.shortCircuit) {
            return result;
         }
         errors = result.errors;
      }
   }

   if (s.validate) {
      const result = s.validate(value, opts);
      if (!result.valid) {
         errors = result.errors;
      }
   }

   return {
      valid: errors.length === 0,
      errors,
   };
}
