import { describe, test, expect } from "bun:test";
import { object } from "./object/object";
import type { Static } from "./static";
import { type TSchema, any } from "./schema";
import { assertJson } from "./assert";
import { expectTypeOf } from "expect-type";
import type { StaticCoerced } from "./static";
import { $kind } from "./symbols";

describe("schema", () => {
   test("TSchema", () => {
      type S = TSchema<1>;
      type Inferred = Static<S>;
      type Coerced = StaticCoerced<S>;
      expectTypeOf<Inferred>().toEqualTypeOf<1>();
      expectTypeOf<Coerced>().toEqualTypeOf<1>();
   });

   test("any", () => {
      const schema = any();
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<any>();
      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Coerced>().toEqualTypeOf<any>();

      expect<any>(schema[$kind]).toEqual("any");

      assertJson(schema, {});
   });

   test("any optional in object", () => {
      const schema = object({
         name: any().optional(),
      });
      type Inferred = Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{ name?: any }>();
      type Coerced = StaticCoerced<typeof schema>;
      expectTypeOf<Coerced>().toEqualTypeOf<{ name?: any }>();

      assertJson(schema, {
         type: "object",
         properties: {
            name: {},
         },
      });
   });
});
