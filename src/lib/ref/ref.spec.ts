import { expectTypeOf } from "expect-type";
import { type Static, type StaticCoersed } from "../static";
import { ref } from "./ref";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";
import { string, number, object, anyOf } from "../";
import { $kind } from "../symbols";

describe("ref", () => {
   test("basic", () => {
      const referenced = string({ $id: "string" });
      const schema = ref(referenced);
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();

      expect<any>(schema[$kind]).toEqual("ref");
      expect<any>(schema.$ref).toEqual("#/$defs/string");
      assertJson(schema, {
         $ref: "#/$defs/string",
      });
   });

   test("checks $id", () => {
      // @ts-expect-error must have $id set
      expect(() => ref(string())).toThrow();
   });

   test("prefix", () => {
      const schema = ref(string({ $id: "string" }), "definitions");
      expect(schema.$ref).toEqual("#/definitions/string");
   });

   test("rec with coerce", () => {
      const s = anyOf([number({ default: 10 }), string()], {
         coerce: Number,
         $id: "numberOrString",
      });
      const sRef = ref(s);
      const query = object(
         {
            limit: sRef,
            offset: number(),
         },
         {
            $defs: {
               numberOrString: s,
            },
         }
      );
      type Inferred = Static<typeof query>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         limit: number | string;
         offset: number;
      }>();
      type Coerced = StaticCoersed<typeof query>;
      expectTypeOf<Coerced>().toEqualTypeOf<{
         limit: number;
         offset: number;
      }>();
      expect(query.toJSON()).toEqual({
         $defs: {
            numberOrString: {
               $id: "numberOrString",
               anyOf: [{ type: "number", default: 10 }, { type: "string" }],
            },
         },
         type: "object",
         properties: {
            limit: { $ref: "#/$defs/numberOrString" },
            offset: { type: "number" },
         },
         required: ["limit", "offset"],
      });
   });
});
