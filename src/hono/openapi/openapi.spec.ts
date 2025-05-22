import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { describeRoute, openAPISpecs } from "./openapi";
import { validator } from "../middleware";
import * as s from "../../lib";

describe("openapi", () => {
   test("...", async () => {
      const app = new Hono();

      app.get("/", openAPISpecs(app));

      app.get(
         "/test/:id",
         describeRoute({
            summary: "Test",
            description: "Test description",
            responses: {
               200: {
                  description: "OK",
                  content: {
                     "application/json": {
                        schema: s.object({ name: s.string() }).toJSON(),
                     },
                  },
               },
            },
            parameters: [
               {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: s.string().toJSON(),
               },
            ],
         }),
         validator("query", s.object({ name: s.string() })),
         validator("param", s.object({ id: s.string() })),
         validator("json", s.object({ name: s.string() })),
         validator("cookie", s.partialObject({ name: s.string() })),
         async (c) => {
            return c.text("hello");
         }
      );

      const res = await app.request("/");
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
   });
});
