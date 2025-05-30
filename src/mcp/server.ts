import type { Context as HonoContext } from "hono";
import * as messages from "./messages";
import type { RpcMessage, TRpcId, TRpcRequest, TRpcResponse } from "./rpc";
import * as s from "../lib";
import type { Tool } from "./tool";
import { McpError } from "./error";
import type { TResourceUri } from "./resource";
import type { Resource } from "./resource";

const serverInfoSchema = s.object({
   name: s.string(),
   version: s.string(),
});
export type McpServerInfo = s.Static<typeof serverInfoSchema>;

export class McpServer<ServerContext extends object = {}> {
   protected readonly messages: RpcMessage<string, s.TSchema>[] = [];
   readonly version = "2025-03-26";
   protected currentId: TRpcId | undefined;
   readonly history: Map<
      TRpcId,
      {
         request: TRpcRequest;
         response?: TRpcResponse;
      }
   > = new Map();
   tools: Tool<string, s.TSchema>[] = [];
   resources: Resource<string, TResourceUri>[] = [];

   constructor(
      readonly context: ServerContext = {} as ServerContext,
      readonly serverInfo: s.Static<typeof serverInfoSchema> = {
         name: "mcp-server",
         version: "0.0.0",
      }
   ) {
      this.messages = Object.values(messages).map(
         (Message) => new Message(this)
      );
   }

   registerTool(tool: Tool<any, any>) {
      this.tools.push(tool);
   }

   registerResource(resource: Resource<any, any>) {
      this.resources.push(resource);
   }

   get console() {
      return {
         log: (...args: any[]) => console.log("[MCP]", ...args),
         error: (...args: any[]) => console.error("[MCP]", ...args),
         warn: (...args: any[]) => console.warn("[MCP]", ...args),
      };
   }

   async handle(c: HonoContext): Promise<Response> {
      try {
         const request = c.req.raw;
         const method = request.method;

         if (method === "POST") {
            let body: TRpcRequest | undefined;
            try {
               body = (await request.json()) as TRpcRequest;
               this.currentId = body.id;
            } catch (e) {
               this.console.error(e);
               throw new McpError("ParseError", {
                  error: String(e),
               });
            }

            if (this.currentId) {
               if (this.history.has(this.currentId)) {
                  this.console.warn("duplicate request", this.currentId);
                  throw new McpError("InvalidRequest", {
                     error: "Duplicate request",
                  });
               } else {
                  this.history.set(this.currentId, {
                     request: body,
                  });
               }
            }

            this.console.log("message", body);

            const message = this.messages.find((m) => m.is(body));
            if (message) {
               const result = await message.respond(body);
               this.console.log("result", result);

               if (result === null) {
                  c.status(202);
                  return c.body(null);
               }

               if (this.currentId) {
                  this.history.set(this.currentId, {
                     request: body,
                     response: result,
                  });
               }

               return c.json(result, 200);
            }

            throw new McpError("MethodNotFound", {
               method,
            });
         }

         console.log("invalid request", method, request);

         throw new McpError("InvalidRequest");
      } catch (e) {
         this.console.error(String(e));
         if (e instanceof McpError) {
            return c.json(e.setId(this.currentId).toJSON(), e.statusCode);
         }

         return c.json(new McpError("InternalError").toJSON(), 500);
      }
   }
}
