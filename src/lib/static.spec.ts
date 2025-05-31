import { describe, test } from "bun:test";
import { expectTypeOf } from "expect-type";
import type { OptionalUndefined } from "./static";

describe("static", () => {
   test("OptionalUndefined", () => {
      type A = {
         a: string;
         b: number | undefined;
      };

      type A_ = OptionalUndefined<A>;
      //   ^?
      expectTypeOf<A_>().toEqualTypeOf<{
         a: string;
         b?: number;
      }>();
   });
});
