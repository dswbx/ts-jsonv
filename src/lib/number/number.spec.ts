import { expectTypeOf } from "expect-type";
import { $kind, type Static, type TSchema } from "../base";
import { number } from "./number";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";

describe("number", () => {
   test("basic", () => {
      const schema = number();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<number>();

      expect<any>(number()).toEqual({
         type: "number",
         [$kind]: "number",
      });
      assertJson(number(), { type: "number" });
   });

   test("with const", () => {
      const schema = number({ const: 1 });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1>();

      assertJson(number({ const: 1 }), {
         type: "number",
         const: 1,
      });
   });

   test("with enum", () => {
      const schema = number({ enum: [1, 2, 3] });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<1 | 2 | 3>();

      assertJson(number({ enum: [1, 2, 3] }), {
         type: "number",
         enum: [1, 2, 3],
      });
   });

   test("number schema", () => {
      assertJson(number({ minimum: 1 }), {
         type: "number",
         minimum: 1,
      });
      assertJson(number({ maximum: 1 }), {
         type: "number",
         maximum: 1,
      });
      assertJson(number({ multipleOf: 1 }), {
         type: "number",
         multipleOf: 1,
      });
   });
});
