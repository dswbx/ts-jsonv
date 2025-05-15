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
import { isSchema, isString } from "../utils";
import { getJsonPath } from "../utils/path";

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
   ignoreUnsupported?: boolean;
   cache?: Map<string, TSchema>;
   root?: TSchema;
};
type CtxValidationOptions = Required<ValidationOptions>;

export type ValidationResult = {
   valid: boolean;
   errors: ErrorDetail[];
};

export function validate(
   s: TSchema,
   _value: unknown,
   opts: ValidationOptions = {}
): ValidationResult {
   console.log("---validate", s);
   const value = opts?.coerce ? s.coerce(_value) : _value;
   const ctx: CtxValidationOptions = {
      keywordPath: opts.keywordPath || [],
      instancePath: opts.instancePath || [],
      coerce: opts.coerce || false,
      errors: opts.errors || [],
      shortCircuit: opts.shortCircuit || false,
      ignoreUnsupported: opts.ignoreUnsupported || false,
      root: opts.root || s,
      cache: opts.cache || new Map<string, TSchema>(),
   };

   if (opts.ignoreUnsupported !== true) {
      // @todo: readOnly
      // @todo: $ref
      // @todo: $defs
      const todo = ["$ref", "$defs"];
      for (const item of todo) {
         if (s[item]) {
            throw new Error(`${item} not implemented`);
         }
      }
   }

   // check $ref
   if (value !== undefined && "$ref" in s && isString(s.$ref)) {
      const ref = s.$ref;
      let refSchema = ctx.cache.get(ref);
      if (!refSchema) {
         // get ref from root
         refSchema = getJsonPath(ctx.root, ref);
         if (!isSchema(refSchema)) {
            throw new Error(`ref not found: ${ref}`);
         }
         ctx.cache.set(ref, refSchema);
      }
      const result = refSchema.validate(value, {
         ...ctx,
         errors: [],
      });
      if (!result.valid) {
         // @todo: leads to duplicate errors
         ctx.errors.push(...result.errors);
      }
   } else {
      for (const [keyword, validator] of Object.entries(keywords)) {
         if (s[keyword] === undefined) continue;
         const result = validator(s, value, {
            ...ctx,
            errors: [],
         });
         if (!result.valid) {
            if (opts.shortCircuit) {
               return result;
            }
            ctx.errors.push(...result.errors);
         }
      }
   }

   return {
      valid: ctx.errors.length === 0,
      errors: ctx.errors,
      // @ts-ignore
      $refs: Object.fromEntries(ctx.cache.entries()),
   };
}
