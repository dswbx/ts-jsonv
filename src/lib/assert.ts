import { expect } from "bun:test";
import type { TSchema } from "./base";

export const assertJson = (schema: TSchema, expected: object) => {
   const json = JSON.parse(JSON.stringify(schema));
   expect(json).toEqual(expected);
};
