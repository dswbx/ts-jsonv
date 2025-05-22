import { validators, schemas } from "./inc";
import { bench, run, summary } from "mitata";

summary(() => {
   for (const { name, validate } of validators) {
      bench(name, () => {
         for (const { schema, data } of schemas) {
            for (const [_data] of data) {
               validate(schema, _data);
            }
         }
      });
   }
});

await run();
