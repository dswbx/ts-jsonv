import type { TSchema } from "../schema";
import type { ErrorDetail } from "../utils/details";
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
import { Resolver } from "./resolver";

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
   resolver?: Resolver;
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
   //console.log("---validate", opts);
   const value = opts?.coerce ? s.coerce(_value) : _value;
   const ctx: CtxValidationOptions = {
      keywordPath: opts.keywordPath || [],
      instancePath: opts.instancePath || [],
      coerce: opts.coerce || false,
      errors: opts.errors || [],
      shortCircuit: opts.shortCircuit || false,
      ignoreUnsupported: opts.ignoreUnsupported || false,
      resolver: opts.resolver || new Resolver(s),
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
   if (ctx.resolver.hasRef(s, value)) {
      const result = ctx.resolver.resolve(s.$ref).validate(value, {
         ...ctx,
         errors: [],
      });
      if (!result.valid) {
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
      //$refs: Object.fromEntries(ctx.cache.entries()),
   };
}
