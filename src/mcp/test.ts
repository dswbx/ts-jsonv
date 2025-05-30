import { Hono } from "hono";
import { McpServer } from "./server";
import { Tool } from "./tool";
import * as s from "../lib";
import { mcp } from "./middleware";
import { Resource } from "./resource";

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

const context = new Tool(
   "context",
   async (params, c) => {
      console.log("--context", {
         context: c.context,
         params,
      });
      return c.json({
         context: c.context,
      });
   },
   undefined
);

const staticResource = new Resource(
   "static",
   "users://123/profile",
   async () => {
      return {
         text: "hello world",
      };
   }
);

const dynamicResource = new Resource(
   "dynamic",
   "users://{username}/profile",
   async ({ username }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
         text: `hello ${username}`,
      };
   }
);

const app = new Hono().use(
   mcp({
      context: {
         random: "bla bla",
      },
      tools: [test, context],
      resources: [staticResource, dynamicResource],
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
