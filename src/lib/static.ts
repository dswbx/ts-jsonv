import type { TAnySchema, TSchema } from "./schema";

// from https://github.com/type-challenges/type-challenges/issues/28200
export type Merge<T> = {
   [K in keyof T]: T[K];
};
export type OptionalUndefined<
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

export type Static<S extends TAnySchema> = S["static"] extends {
   [key: string]: any;
}
   ? Simplify<S["static"]>
   : S["static"];

export type StaticCoerced<S extends TAnySchema> = S["coerce"] extends (
   v: unknown
) => infer R
   ? R extends { [key: string]: unknown }
      ? Simplify<OptionalUndefined<R>>
      : R
   : never;

export type StaticConstEnum<
   Schema extends { const?: unknown; enum?: unknown },
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
