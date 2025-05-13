import { test, expect, describe } from "bun:test";
import { mergeAllOf } from "./merge-allof";

describe("mergeAllOf", () => {
   test("base", () => {
      expect(
         mergeAllOf({
            allOf: [
               {
                  properties: {
                     bar: { type: "integer" },
                  },
                  required: ["bar"],
               },
               {
                  properties: {
                     foo: { type: "string" },
                  },
                  required: ["foo"],
               },
            ],
         })
      ).toEqual({
         properties: {
            bar: {
               type: "integer",
            },
            foo: {
               type: "string",
            },
         },
         required: ["bar", "foo"],
      } as any);

      expect(
         mergeAllOf({
            allOf: [true, true],
         }) as any
      ).toEqual(true);

      expect(
         mergeAllOf({
            allOf: [true, false],
         }) as any
      ).toEqual(false);

      expect(
         mergeAllOf({
            allOf: [
               {
                  allOf: [
                     {
                        type: "null",
                     },
                  ],
               },
            ],
         }) as any
      ).toEqual({
         type: "null",
      });

      console.log(
         mergeAllOf({
            allOf: [{ multipleOf: 2 }],
            anyOf: [{ multipleOf: 3 }],
            oneOf: [{ multipleOf: 5 }],
         })
      );
   });
});
