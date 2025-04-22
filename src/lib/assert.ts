import { expect } from "bun:test";
import type { TSchema } from "./base";

export const assertJson = (schema: TSchema, expected: object) => {
   const json = JSON.parse(JSON.stringify(schema));
   expect(json).toEqual(expected);
};

export const assertSchema = <T extends TSchema>(
   schema: T,
   expected: Omit<T, "validate" | "static">
) => {
   const { validate, ...rest } = schema;
   expect<any>(rest).toEqual(expected);
};
