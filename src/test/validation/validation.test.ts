import { describe, expect, test } from "bun:test";
import { validators, schemas } from "./inc";

describe("validation", () => {
   for (const { name, validate, prepare } of validators) {
      describe(name, () => {
         for (const { name, schema, data } of schemas) {
            test(name, () => {
               for (const [_data, valid] of data) {
                  const result = validate(prepare(schema, _data), _data);
                  expect(result).toBe(valid);
               }
            });
         }
      });
   }
});
