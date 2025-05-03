import type { BaseJSONSchema } from "./types";

export const $kind = Symbol.for("kind");
export const $fn = Symbol.for("fn");
export const $optional = Symbol.for("optional");

export type TSchemaTemplateOptions = {
   withOptional?: boolean;
};

export interface TSchema<Kind extends string = string> extends BaseJSONSchema {
   [$kind]: Kind;
   $id?: string;
   static: unknown;
   validate: (value: unknown) => void | string;
   template: (opts?: TSchemaTemplateOptions) => unknown;
}
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

export type Static<S extends TSchema> = S["static"] extends Record<
   string,
   unknown
>
   ? OptionalUndefined<S["static"]>
   : S["static"];

export interface TOptional<S extends TSchema> extends TSchema {
   schema: S;
   static: Static<S> | undefined;
}

export const optional = <S extends TSchema>(schema: S): TOptional<S> =>
   ({
      ...schema,
      [$optional]: true,
   } as any);

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
): S {
   return {
      ...schema,
      validate: function (this: S, value: unknown) {
         if (this.const !== undefined && this.const !== value) return "const";
         if (this.enum && !this.enum.includes(value)) return "enum";
         if (schema.validate) return schema.validate(value);
         return "not implemented";
      },
      template: function (this: S, opts: TSchemaTemplateOptions = {}) {
         if (this.default !== undefined) return this.default;
         if (this.const !== undefined) return this.const;
         if (schema.template) return schema.template(opts);
         return undefined;
      },
      [$kind]: kind,
   } as any;
}
