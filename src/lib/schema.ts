import { $kind, $optional, $raw } from "./symbols";
import type {
   Merge,
   Simplify,
   Static,
   StaticCoersed,
   StaticConstEnum,
} from "./static";
import { isBoolean, isObject } from "./utils";
import { validate } from "./validation/validate";
import type {
   ValidationResult,
   ValidationOptions,
} from "./validation/validate";
import { error, valid } from "./utils/details";

export type PropertyName = string;
export type JSONSchemaTypeName =
   | "string"
   | "number"
   | "integer"
   | "boolean"
   | "object"
   | "array"
   | "null";

export type TSchemaTemplateOptions = {
   withOptional?: boolean;
};

export interface TSchemaFn {
   validate: (value: unknown, opts?: ValidationOptions) => ValidationResult;
   template: (opts?: TSchemaTemplateOptions) => unknown;
   coerce: (value: unknown) => unknown;
   toJSON: () => object;
}

export interface TOptional<Schema extends TSchema = TSchema> extends TSchema {
   optional: never;
   static: Static<Schema> | undefined;
   coerce: (value: unknown) => StaticCoersed<Schema> | undefined;
}

export interface TSchemaBase {
   // basic/meta
   $id?: string;
   $ref?: string;
   $schema?: string;
   title?: string;
   description?: string;
   default?: any;
   readOnly?: boolean;
   writeOnly?: boolean;
   $defs?: { [key in PropertyName]: TSchemaBase };
   $comment?: string;

   // data types & common
   type?: JSONSchemaTypeName | JSONSchemaTypeName[];
   enum?: readonly any[] | any[];
   const?: any;

   // string
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;

   // number
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;

   // array
   items?: TSchemaBase | boolean;
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
   contains?: TSchemaBase;
   minContains?: number;
   maxContains?: number;
   prefixItems?: TSchemaBase[];

   // object
   properties?: { [key in PropertyName]: TSchemaBase };
   patternProperties?: { [key: string]: TSchemaBase };
   additionalProperties?: TSchemaBase | boolean;
   required?: PropertyName[];
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: TSchemaBase;
   dependentRequired?: { [key in PropertyName]: PropertyName[] };
   dependentSchemas?: { [key in PropertyName]: TSchemaBase };

   // Combining schemas
   allOf?: TSchemaBase[];
   anyOf?: TSchemaBase[];
   oneOf?: TSchemaBase[];
   not?: TSchemaBase;
   if?: TSchemaBase;
   then?: TSchemaBase;
   else?: TSchemaBase;
}

export type TAnySchema = {
   static: unknown;
   coerce: (value: unknown) => unknown;
};

export interface TSchema<Type = unknown> extends TSchemaBase, TSchemaFn {
   optional: () => TOptional<this>;
   coerce: (value: unknown) => Type;
   static: Type;
   [$kind]: string;
   [$raw]: any;

   // overrides
   $defs?: { [key in PropertyName]: TSchema };
   items?: TSchema;
   contains?: TSchema;
   prefixItems?: TSchema[];
   properties?: { [key in PropertyName]: TSchema };
   patternProperties?: { [key: string]: TSchema };
   additionalProperties?: TSchema;
   propertyNames?: TSchema;
   dependentSchemas?: { [key in PropertyName]: TSchema };
   allOf?: TSchema[];
   anyOf?: TSchema[];
   oneOf?: TSchema[];
   not?: TSchema;
   if?: TSchema;
   then?: TSchema;
   else?: TSchema;
}

export type TCustomSchema<
   Options extends TSchemaBase,
   Fallback = unknown
> = TSchema & {
   static: StaticConstEnum<Options, Fallback>;
   optional: () => TOptional<TCustomSchema<Options, Fallback>>;
   coerce: (value: unknown) => StaticConstEnum<Options, Fallback>;
} & {
   [K in keyof Options]: Options[K];
} & TSchemaFn;

export const schema = <
   const Type = unknown,
   const S extends Partial<TSchema> | boolean = Partial<TSchema>,
   Static = S extends { const?: unknown; enum?: unknown }
      ? StaticConstEnum<S, Type>
      : Type
>(
   _s: S = {} as S,
   kind: string = "any"
): TSchema<Static> => {
   const s = (isObject(_s) ? _s : {}) as unknown as TSchema;
   // @ts-ignore
   const raw = isBoolean(_s) ? _s : $raw in _s ? _s[$raw] : undefined;

   const s2 = {
      ...s,
      [$kind]: kind,
      [$raw]: raw,
      optional: function (this: TSchema) {
         return schema(
            {
               ...this,
               [$raw]: raw,
               [$optional]: true,
            },
            kind
         );
      },
      coerce: function (value: unknown) {
         if (s.coerce) return s.coerce(value);
         return value;
      },
      template: function (opts: TSchemaTemplateOptions = {}) {
         if (s.default !== undefined) return s.default;
         if (s.const !== undefined) return s.const;
         if (s.template) return s.template(opts);
         return undefined;
      },
      toJSON: function () {
         const raw = this[$raw];
         if (isBoolean(raw)) return raw;
         return JSON.parse(JSON.stringify(s));
      },
   };

   // important to split here, to get all schema methods (required for isSchema check)
   s2.validate = function (value: unknown, opts: ValidationOptions = {}) {
      if (isBoolean(raw)) {
         return raw === false ? error(opts, "", "Always fails") : valid();
      }

      return validate(s2 as any, value, opts);
   };

   return s2 as any;
};

export const any = <O extends TSchema>(
   options: Partial<O> = {} as Partial<O>
) => {
   return schema<any, O>(options as O, "any");
};
