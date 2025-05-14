import { test, expect, describe } from "bun:test";
import { Hono } from "hono";
import { honoValidator as jsc } from "./middleware";
import * as s from "../lib";

describe("hono middleware", () => {
   test("should return the validated json", async () => {
      const app = new Hono();
      app.post(
         "/json",
         jsc(
            "json",
            s.object({
               name: s.string(),
            })
         ),
         (c) => {
            const json = c.req.valid("json");
            //    ^?
            return c.json(json);
         }
      );

      const req = async (input: object): Promise<any> => {
         const res = await app.request("http://localhost:3000/json", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify(input),
         });
         return await res.json();
      };

      expect(await req({ name: "John Doe" })).toEqual({
         name: "John Doe",
      });
      expect((await req({})).valid).toEqual(false);
   });

   test("query coercion", async () => {
      const app = new Hono();
      app.get(
         "/query",
         jsc(
            "query",
            s.partialObject({
               int: s.number(),
               bool: s.boolean(),
               str: s.string(),
            })
         ),
         (c) => {
            const json = c.req.valid("query");
            //    ^?
            return c.json(json);
         }
      );

      const req = async (input: object): Promise<any> => {
         const params = new URLSearchParams(input as any);
         const res = await app.request(
            "http://localhost:3000/query?" + params.toString(),
            {
               method: "GET",
            }
         );
         return await res.json();
      };

      expect(await req({ int: "123", bool: "true", str: "test" })).toEqual({
         int: 123,
         bool: true,
         str: "test",
      });
   });
});
