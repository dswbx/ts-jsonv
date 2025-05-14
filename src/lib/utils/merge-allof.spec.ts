import { test, expect, describe } from "bun:test";
import { mergeAllOf } from "./merge-allof";
import { fromSchema } from "../schema/from-schema";

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

      /* console.log(
         JSON.stringify(
            fromSchema({
               allOf: [{ properties: { foo: {} } }],
               additionalProperties: { type: "boolean" },
            }),
            null,
            2
         )
      ); */
   });
});
