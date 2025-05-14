import { describe, expect, test } from "bun:test";
import { expectTypeOf } from "expect-type";
import * as s from "../lib";
import { assertJson } from "../lib/assert";
import type { NumberSchema } from "../lib/types";

describe("Field", () => {
   const ActionContext = ["create", "read", "update", "delete"] as const;
   const TmpContext = [
      "create",
      "read",
      "update",
      "delete",
      "form",
      "table",
      "submit",
   ] as const;

   const DEFAULT_REQUIRED = false;
   const DEFAULT_FILLABLE = true;
   const DEFAULT_HIDDEN = false;

   const baseFieldConfig = s.partialObject({
      label: s.string(),
      description: s.string(),
      required: s.boolean({ default: DEFAULT_REQUIRED }),
      virtual: s.boolean({ default: false }),
      default_value: s.any(),
      fillable: s.anyOf(
         [
            s.boolean({ title: "Boolean", default: DEFAULT_FILLABLE }),
            s.array(s.string({ enum: ActionContext, title: "Context" }), {
               uniqueItems: true,
            }),
         ],
         {
            default: DEFAULT_FILLABLE,
         }
      ),
      hidden: s.anyOf(
         [
            s.boolean({ title: "Boolean", default: DEFAULT_HIDDEN }),
            s.array(s.string({ enum: TmpContext, title: "Context" }), {
               uniqueItems: true,
            }),
         ],
         {
            default: DEFAULT_HIDDEN,
         }
      ),
   });
   type InferredBaseFieldConfig = s.Static<typeof baseFieldConfig>;

   test("BaseField config", () => {
      expectTypeOf<InferredBaseFieldConfig>().toEqualTypeOf<{
         label?: string;
         description?: string;
         required?: boolean;
         virtual?: boolean;
         default_value?: any;
         fillable?: boolean | ("create" | "read" | "update" | "delete")[];
         hidden?:
            | boolean
            | (
                 | "create"
                 | "read"
                 | "update"
                 | "delete"
                 | "form"
                 | "table"
                 | "submit"
              )[];
      }>();

      expect(baseFieldConfig.template()).toEqual({});
      expect(baseFieldConfig.template({ withOptional: true })).toEqual({
         label: "",
         description: "",
         required: false,
         virtual: false,
         fillable: true,
         hidden: false,
      });
   });

   test("NumberField config", () => {
      const schema = s.partialObject({
         default_value: s.number(),
         minimum: s.number(),
         maximum: s.number(),
         exclusiveMinimum: s.boolean(),
         exclusiveMaximum: s.boolean(),
         multipleOf: s.number(),
      });
      type Inferred = s.Static<typeof schema>;
      expectTypeOf<Inferred>().toEqualTypeOf<{
         default_value?: number;
         minimum?: number;
         maximum?: number;
         exclusiveMinimum?: boolean;
         exclusiveMaximum?: boolean;
         multipleOf?: number;
      }>();

      assertJson(schema, {
         additionalProperties: false,
         type: "object",
         properties: {
            default_value: { type: "number" },
            minimum: { type: "number" },
            maximum: { type: "number" },
            exclusiveMinimum: { type: "boolean" },
            exclusiveMaximum: { type: "boolean" },
            multipleOf: { type: "number" },
         },
      });

      const combined = s.partialObject({
         ...baseFieldConfig.properties,
         ...schema.properties,
      });
      type CombinedInferred = s.Static<typeof combined>;
      expectTypeOf<CombinedInferred>().toEqualTypeOf<{
         default_value?: number;
         minimum?: number;
         maximum?: number;
         exclusiveMinimum?: boolean;
         exclusiveMaximum?: boolean;
         multipleOf?: number;
         label?: string;
         description?: string;
         required?: boolean;
         virtual?: boolean;
         fillable?: boolean | ("create" | "read" | "update" | "delete")[];
         hidden?:
            | boolean
            | (
                 | "create"
                 | "read"
                 | "update"
                 | "delete"
                 | "form"
                 | "table"
                 | "submit"
              )[];
      }>();
   });
});

describe("AppServer", () => {
   const schema = s.strictObject({
      cors: s.strictObject(
         {
            origin: s.string({ default: "*" }),
            allow_methods: s.array(
               s.string({ enum: ["GET", "POST", "PUT", "DELETE"] }),
               {
                  uniqueItems: true,
               }
            ),
            allow_headers: s.array(s.string(), { uniqueItems: true }),
         },
         { default: {} }
      ),
   });
   type Inferred = s.Static<typeof schema>;
   expectTypeOf<Inferred>().toEqualTypeOf<{
      cors: {
         origin: string;
         allow_methods: ("GET" | "POST" | "PUT" | "DELETE")[];
         allow_headers: string[];
      };
   }>();

   assertJson(schema, {
      type: "object",
      properties: {
         cors: {
            type: "object",
            default: {},
            additionalProperties: false,
            properties: {
               origin: { type: "string", default: "*" },
               allow_methods: {
                  type: "array",
                  items: {
                     type: "string",
                     enum: ["GET", "POST", "PUT", "DELETE"],
                  },
                  uniqueItems: true,
               },
               allow_headers: {
                  type: "array",
                  items: { type: "string" },
                  uniqueItems: true,
               },
            },
            required: ["origin", "allow_methods", "allow_headers"],
         },
      },
      required: ["cors"],
      additionalProperties: false,
   });
});

describe("misc", () => {
   test("RepoQuery", () => {
      const numberOrString = <N extends NumberSchema>(c: N = {} as N) =>
         s.anyOf([s.number(c), s.string()], {
            coerce: Number,
         });
      const n = numberOrString();
      type NumberOrStringCoerced = s.StaticCoersed<typeof n>;
      expectTypeOf<NumberOrStringCoerced>().toEqualTypeOf<number>();

      const stringArray = s.anyOf(
         [
            s.string(),
            s.array(s.string(), {
               uniqueItems: true,
            }),
         ],
         {
            coerce: (v): string[] => {
               if (Array.isArray(v)) {
                  return v;
               }
               return [String(v)];
            },
         }
      );
      type StringArrayIn = s.Static<typeof stringArray>;
      expectTypeOf<StringArrayIn>().toEqualTypeOf<string | string[]>();
      type StringArrayOut = s.StaticCoersed<typeof stringArray>;
      expectTypeOf<StringArrayOut>().toEqualTypeOf<string[]>();

      const sortObj = s.object({
         by: s.string(),
         dir: s.string({ enum: ["asc", "desc"] }),
      });
      type SortObj = s.Static<typeof sortObj>;
      expectTypeOf<SortObj>().toEqualTypeOf<{
         by: string;
         dir: "asc" | "desc";
      }>();

      const sort = s.anyOf([s.string(), sortObj], {
         coerce: (v): SortObj => {
            if (typeof v === "string") {
               return { by: v, dir: "asc" };
            }
            return v as SortObj;
         },
      });
      type SortIn = s.Static<typeof sort>;
      expectTypeOf<SortIn>().toEqualTypeOf<
         | string
         | {
              by: string;
              dir: "asc" | "desc";
           }
      >();
      type SortOut = s.StaticCoersed<typeof sort>;
      expectTypeOf<SortOut>().toEqualTypeOf<{
         by: string;
         dir: "asc" | "desc";
      }>();

      const repoQuery = s.partialObject({
         limit: numberOrString({ default: 10 }),
         offset: numberOrString({ default: 0 }),
         sort,
         select: stringArray,
         join: stringArray,
      });
      type RepoQueryIn = s.Static<typeof repoQuery>;
      expectTypeOf<RepoQueryIn>().toEqualTypeOf<{
         limit?: number | string;
         offset?: number | string;
         sort?: string | { by: string; dir: "asc" | "desc" };
         select?: string | string[];
         join?: string | string[];
      }>();

      type RepoQueryOut = s.StaticCoersed<typeof repoQuery>;
      expectTypeOf<RepoQueryOut>().toEqualTypeOf<{
         limit?: number;
         offset?: number;
         sort?: { by: string; dir: "asc" | "desc" };
         select?: string[];
         join?: string[];
      }>();

      /* console.log(JSON.stringify(repoQuery.toJSON(), null, 2));
      console.log(repoQuery.coerce({})); */

      expect(repoQuery.coerce({ limit: "11", select: "id" })).toEqual({
         limit: 11,
         select: ["id"],
      });
   });
});
