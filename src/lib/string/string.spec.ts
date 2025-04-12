import { expectTypeOf } from "expect-type";
import { $kind, type Static, type TSchema } from "../base";
import { string, stringConst } from "./string";
import { assertJson } from "../assert";
import { describe, expect, test } from "bun:test";

describe("string", () => {
   test("basic", () => {
      const schema = string();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();

      expect<any>(string()).toEqual({
         type: "string",
         [$kind]: "string",
      });
      assertJson(string(), { type: "string" });
   });

   test("with const", () => {
      const schema = string({ const: "hello" });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"hello">();

      assertJson(string({ const: "hello" }), {
         type: "string",
         const: "hello",
      });
   });

   test("with enum", () => {
      const schema = string({ enum: ["a", "b", "c"] });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"a" | "b" | "c">();

      assertJson(string({ enum: ["a", "b", "c"] }), {
         type: "string",
         enum: ["a", "b", "c"],
      });
   });

   test("string schema", () => {
      assertJson(string({ minLength: 1 }), {
         type: "string",
         minLength: 1,
      });
      assertJson(string({ maxLength: 1 }), {
         type: "string",
         maxLength: 1,
      });
      assertJson(string({ pattern: "/a/" }), {
         type: "string",
         pattern: "/a/",
      });
   });

   test("stringConst", () => {
      const schema = stringConst({ const: "hello" });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<"hello">();

      expect<any>(schema).toEqual({
         type: "string",
         [$kind]: "string",
         const: "hello",
         default: "hello",
         readOnly: true,
      });

      assertJson(schema, {
         type: "string",
         const: "hello",
         default: "hello",
         readOnly: true,
      });
   });
});
