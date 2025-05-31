import { describe, test } from "bun:test";
import type { Static } from "../static";
import { type TSchema } from "../schema";
import { expectTypeOf } from "expect-type";
import type { StaticCoerced } from "../static";

describe("schema", () => {
   test("TSchema", () => {
      type S = TSchema<1>;
      type Inferred = Static<S>;
      type Coerced = StaticCoerced<S>;
      expectTypeOf<Inferred>().toEqualTypeOf<1>();
      expectTypeOf<Coerced>().toEqualTypeOf<1>();
   });
});
