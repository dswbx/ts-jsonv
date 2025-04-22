import type { BaseJSONSchema } from "./types";

export const $kind = Symbol.for("kind");
export const $optional = Symbol.for("optional");

export interface TSchema extends BaseJSONSchema {
   [$kind]: string;
   $id?: string;
   static: unknown;
   validate: (value: unknown) => void | string;
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
