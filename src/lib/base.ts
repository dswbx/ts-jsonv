import type { BaseJSONSchema } from "./types";

export const $kind = Symbol.for("kind");
export const $optional = Symbol.for("optional");

export type TSchemaTemplateOptions = {
   withOptional?: boolean;
};

export interface TSchemaFn {
   validate: (value: unknown) => void | string;
   template: (opts?: TSchemaTemplateOptions) => unknown;
   coerce: (value: unknown) => unknown;
}

export interface TSchema<Kind extends string = any>
   extends BaseJSONSchema,
      TSchemaFn {
   [$kind]: Kind;
   $id?: string;
   static: unknown;
}

export type TSchemaWithFn<S extends BaseJSONSchema> = S & Partial<TSchemaFn>;

// from https://github.com/type-challenges/type-challenges/issues/28200
export type Merge<T> = {
   [K in keyof T]: T[K];
};
type OptionalUndefined<
   T,
   Props extends keyof T = keyof T,
   OptionsProps extends keyof T = Props extends keyof T
      ? undefined extends T[Props]
         ? Props
         : never
      : never
> = Merge<
   {
      [K in OptionsProps]?: T[K];
   } & {
      [K in Exclude<keyof T, OptionsProps>]: T[K];
   }
>;
// https://github.com/sindresorhus/type-fest/blob/main/source/simplify.d.ts
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type Static<S extends TSchema> = S["static"] extends Record<
   string,
   unknown
>
   ? Simplify<OptionalUndefined<S["static"]>>
   : S["static"];

export interface TOptional<S extends TSchema> extends TSchema {
   schema: S;
   static: Static<S> | undefined;
}

export type StaticConstEnum<
   Schema extends BaseJSONSchema,
   Fallback = unknown
> = Schema extends { const: infer C }
   ? C
   : Schema extends { enum: infer E }
   ? E extends readonly any[]
      ? [...E][number]
      : E extends any[]
      ? E[number]
      : Fallback
   : Fallback;

export function create<S extends TSchema>(
   kind: string,
   schema: Partial<S> = {}
): S & { optional: () => TOptional<S> } {
   return {
      ...schema,
      [$kind]: kind,
      optional: function (this: S) {
         return create(kind, {
            ...schema,
            [$optional]: true,
         }) as unknown as TOptional<S>;
      },
      coerce: function (this: S, value: unknown) {
         if (schema.coerce) return schema.coerce(value);
         return value;
      },
      validate: function (this: S, value: unknown) {
         if (Array.isArray(this.type)) {
            throw new Error("type arrays not implemented");
         }

         if (this.const !== undefined && this.const !== value) return "const";
         if (this.enum && !this.enum.includes(value)) return "enum";

         const todo = [
            //"readOnly",
            "dependentRequired",
            "dependentSchemas",
            "if",
            "then",
            "else",
            "not",
            "$ref",
            "$defs",
         ];
         for (const item of todo) {
            if (this[item]) {
               throw new Error(`${item} not implemented`);
            }
         }
         // @todo: readOnly
         // @todo: dependentRequired
         // @todo: dependentSchemas
         // @todo: if
         // @todo: then
         // @todo: else
         // @todo: not
         // @todo: $ref
         // @todo: $defs

         if (schema.validate) return schema.validate(value);
         return "not implemented";
      },
      template: function (opts: TSchemaTemplateOptions = {}) {
         if (this.default !== undefined) return this.default;
         if (this.const !== undefined) return this.const;
         if (schema.template) return schema.template(opts);
         return undefined;
      },
   } as any;
}
