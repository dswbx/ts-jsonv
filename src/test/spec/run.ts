import { getTestFiles, loadTest } from "./utils";
import * as lib from "../../lib";
import { fromSchema } from "../../lib/schema/from-schema";

const files = await getTestFiles("draft2020-12", [/anchor/, /content/]);
//console.log("files", files);

for (const file of files.slice(0, 2)) {
   const { name, content } = await loadTest(file);
   for (const item of content) {
      try {
         console.log(name, item.schema, fromSchema(item.schema));
      } catch (e) {
         console.error(e, {
            file,
            name,
            schema: item.schema,
         });
      }
   }
}

//describe("spec", () => {});
