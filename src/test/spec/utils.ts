import { Glob } from "bun";
import type { JSONSchema } from "../../lib/types";

export async function getTestFiles(draft: string, skip?: RegExp[]) {
   const glob = new Glob("**/*.json");
   const files: string[] = [];
   const dir = `${import.meta.dir}/lib/${draft}`;

   for await (const file of glob.scan(dir)) {
      if (skip && skip.some((r) => r.test(file))) continue;
      files.push(dir + "/" + file);
   }
   return files;
}

export async function loadTest(file: string) {
   const name = file.split("/").pop()!.replace(".json", "");
   const content = await Bun.file(file).json();

   return { name, content } as {
      name: string;
      content: {
         description: string;
         specification: { core: string; quote: string }[];
         schema: JSONSchema;
         tests: {
            description: string;
            data: unknown;
            valid: boolean;
         }[];
      }[];
   };
}
