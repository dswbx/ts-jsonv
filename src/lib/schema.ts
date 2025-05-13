import { $kind, $optional, $raw } from "./symbols";
import type { Static, StaticConstEnum } from "./static";
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
}

export type TOptional<Schema extends TSchema = TSchema> = {
   optional: never;
   static: Static<Schema> | undefined;
};

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
}

export type TAnySchema = { static: unknown };

export interface TSchema<Type = unknown> extends TSchemaBase, TSchemaFn {
   // internal
   optional: () => TOptional<this>;
   static: Type;

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
   items?: TSchema | boolean;
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
   contains?: TSchema;
   minContains?: number;
   maxContains?: number;
   prefixItems?: TSchema[];

   // object
   properties?: { [key in PropertyName]: TSchema };
   patternProperties?: { [key: string]: TSchema };
   additionalProperties?: TSchema | boolean;
   required?: PropertyName[];
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: TSchema;

   // Combining schemas
   allOf?: TSchema[];
   anyOf?: TSchema[];
   oneOf?: TSchema[];
   not?: TSchema;
   if?: TSchema;
   then?: TSchema;
   else?: TSchema;
}

export type TCustomSchema<Options extends TSchemaBase, Fallback = unknown> = {
   static: StaticConstEnum<Options, Fallback>;
   optional: () => TOptional<TCustomSchema<Options, Fallback>>;
} & {
   [K in keyof Options]: Options[K];
} & TSchemaFn;

export const schema = <
   const Type = unknown,
   const S extends TSchemaBase | boolean = TSchemaBase,
   Static = S extends { const?: unknown; enum?: unknown }
      ? StaticConstEnum<S, Type>
      : Type
>(
   _s: S = {} as S,
   kind: string = "any"
): TSchema<Static> & S => {
   const s = (isObject(_s) ? _s : {}) as unknown as TSchema;

   return {
      ...s,
      [$kind]: kind,
      [$raw]: _s,
      optional: function (this: TSchema) {
         return schema(
            {
               ...this,
               [$optional]: true,
            },
            kind
         );
      },
      coerce: function (value: unknown) {
         if (s.coerce) return s.coerce(value);
         return value;
      },
      validate: function (
         this: TSchema,
         value: unknown,
         opts: ValidationOptions = {}
      ) {
         const raw = this[$raw];
         if (isBoolean(raw)) {
            return raw === false ? error(opts, "", "Always fails") : valid();
         }

         return validate(s, value, opts);
      },
      template: function (opts: TSchemaTemplateOptions = {}) {
         if (s.default !== undefined) return s.default;
         if (s.const !== undefined) return s.const;
         if (s.template) return s.template(opts);
         return undefined;
      },
   } as any;
};

export const any = <O extends TSchema>(
   options: Partial<O> = {} as Partial<O>
) => {
   return schema<any, O>(options as O, "any");
};
