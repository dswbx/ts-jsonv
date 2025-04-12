import { $kind, type TSchema, type Static, type Merge } from "../base";
import type { BaseJSONSchema } from "../types";

type StaticUnion<T extends TSchema[]> = T extends [infer U, ...infer Rest]
   ? U extends TSchema
      ? Rest extends TSchema[]
         ? StaticUnion<Rest> | U["static"]
         : U["static"]
      : never
   : never;

export interface TUnion<T extends TSchema[], Kind extends "anyOf" | "oneOf">
   extends TSchema {
   [$kind]: Kind;
   static: StaticUnion<T>;
}

type UnionSchema = BaseJSONSchema;

export const anyOf = <const T extends TSchema[], S extends UnionSchema>(
   schemas: T,
   schema?: S
): TUnion<T, "anyOf"> => {
   return {
      [$kind]: "anyOf",
      ...schema,
      anyOf: schemas,
   } as any;
};

export const oneOf = <const T extends TSchema[], S extends UnionSchema>(
   schemas: T,
   schema?: S
): TUnion<T, "oneOf"> => {
   return {
      [$kind]: "oneOf",
      ...schema,
      oneOf: schemas,
   } as any;
};

type StaticUnionAllOf<T extends TSchema[]> = T extends [infer U, ...infer Rest]
   ? U extends TSchema
      ? Rest extends TSchema[]
         ? Merge<U["static"] & StaticUnionAllOf<Rest>>
         : U["static"]
      : never
   : {};

export interface TUnionAllOf<T extends TSchema[]> extends TSchema {
   type: "union";
   [$kind]: "union";
   static: StaticUnionAllOf<T>;
}

// use with caution!
export const allOf = <const T extends TSchema[], S extends UnionSchema>(
   schemas: T,
   schema?: S
): TUnionAllOf<T> => {
   return {
      [$kind]: "allOf",
      ...schema,
      allOf: schemas,
   } as any;
};
