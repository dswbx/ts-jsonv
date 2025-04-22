import { expectTypeOf } from "expect-type";
import { $kind, type Static, type TSchema } from "../base";
import { string, stringConst } from "./string";
import { assertJson, assertSchema } from "../assert";
import { describe, expect, test } from "bun:test";

describe("string", () => {
   test("basic", () => {
      const schema = string();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<string>();

      assertSchema(string(), {
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

      assertSchema(schema, {
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

   describe("validate", () => {
      test("base", () => {
         const schema = string();
         expect(schema.validate("hello")).toBeUndefined();
         expect(schema.validate(1)).toEqual("type");
         expect(schema.validate(undefined)).toEqual("type");
         expect(schema.validate(null)).toEqual("type");
         expect(schema.validate({})).toEqual("type");
         expect(schema.validate([])).toEqual("type");
      });

      test("const", () => {
         const schema = stringConst({ const: "hello" });
         expect(schema.validate("hello")).toBeUndefined();
         expect(schema.validate("world")).toEqual("const");
      });

      test("enum", () => {
         const schema = string({ enum: ["a", "b", "c"] });
         expect(schema.validate("a")).toBeUndefined();
         expect(schema.validate("b")).toBeUndefined();
         expect(schema.validate("c")).toBeUndefined();
         expect(schema.validate("d")).toEqual("enum");
      });

      test("pattern", () => {
         const schema = string({ pattern: "/a/" });
         expect(schema.validate("a")).toBeUndefined();
         expect(schema.validate("b")).toEqual("pattern");
      });

      test("minLength", () => {
         const schema = string({ minLength: 3 });
         expect(schema.validate("a")).toEqual("minLength");
         expect(schema.validate("ab")).toEqual("minLength");
         expect(schema.validate("abc")).toBeUndefined();
      });

      test("maxLength", () => {
         const schema = string({ maxLength: 3 });
         expect(schema.validate("a")).toBeUndefined();
         expect(schema.validate("ab")).toBeUndefined();
         expect(schema.validate("abc")).toBeUndefined();
         expect(schema.validate("abcd")).toEqual("maxLength");
      });
   });
});
