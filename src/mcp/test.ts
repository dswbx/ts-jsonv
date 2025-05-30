import { Hono } from "hono";
import { McpServer } from "./server";
import { Tool } from "./tool";
import * as s from "../lib";
import { mcp } from "./middleware";

const test = new Tool(
   "test",
   async (params, c) => {
      if (params.age && params.age > 100) {
         throw new Error("yeah that's too old");
      }
      return c.text(`Hello, ${params.name}! Age: ${params.age ?? "unknown"}`);
   },
   s.object({
      name: s.string(),
      age: s.number().optional(),
   })
);

const app = new Hono().use(
   mcp({
      tools: [test],
   })
);

app.all("/mcp_test", async (c) => {
   const server = new McpServer(c, {
      name: "mcp-test",
      version: "0.0.1",
   });
   server.registerTool(test);
   return await server.handle(c);
});

export default app;
