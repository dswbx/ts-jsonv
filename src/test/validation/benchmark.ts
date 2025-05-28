import { validators, schemas } from "./inc";
import { bench, run, summary } from "mitata";

summary(() => {
   for (const { name, validate, prepare } of validators) {
      const _schemas = schemas.map((s) => ({
         ...s,
         schema: prepare(s.schema, null),
      }));
      bench(name, () => {
         for (const { schema, data } of _schemas) {
            for (const [_data] of data) {
               validate(schema, _data);
            }
         }
      });
   }
});

await run();
