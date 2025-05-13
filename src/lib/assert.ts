import { expect } from "bun:test";
import type { TSchemaBase } from "./schema";

export const assertJson = (
   schema: TSchemaBase | { static: any },
   expected: object
) => {
   const json = JSON.parse(JSON.stringify(schema));
   expect(json).toEqual(expected);
};
