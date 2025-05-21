import type { TSchema } from "../schema";
import { getJsonPath } from "../utils/path";
import { isSchema, isString } from "../utils";
import { $kind } from "../symbols";
import crypto from "crypto";

export class Resolver {
   private cache: Map<string, TSchema>;
   public id = crypto.randomUUID();

   constructor(readonly root: TSchema) {
      this.cache = new Map<string, TSchema>();
   }

   hasRef<S extends TSchema>(s: S, value: unknown): s is S & { $ref: string } {
      //if (s[$kind] === "recursive") return false;
      return value !== undefined && "$ref" in s && isString(s.$ref);
   }

   resolve(ref: string): TSchema {
      let refSchema = this.cache.get(ref);
      if (!refSchema) {
         refSchema = getJsonPath(this.root, ref);
         if (!isSchema(refSchema)) {
            throw new Error(`ref not found: ${ref}`);
         }

         if ("$ref" in refSchema && refSchema.$ref === ref) {
            throw new Error(`ref loop: ${ref}`);
         }

         this.cache.set(ref, refSchema);
      }

      return refSchema;
   }
}
