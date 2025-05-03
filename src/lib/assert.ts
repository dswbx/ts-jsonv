import { expect } from "bun:test";
import type { TSchema } from "./base";

export const assertJson = (schema: TSchema, expected: object) => {
   const json = JSON.parse(JSON.stringify(schema));
   expect(json).toEqual(expected);
};

function recursivelyCleanKeys(obj: any, keys: string[]) {
   if (typeof obj !== "object" || obj === null) {
      console.log("not an object");
      return obj;
   }

   for (const key of Object.keys(obj)) {
      if (keys.includes(key)) {
         console.log("deleting", key);
         delete obj[key];
         continue;
      }

      const value = obj[key];

      if (typeof value === "object" && value !== null) {
         recursivelyCleanKeys(value, keys);
      }
   }

   return obj;
}
