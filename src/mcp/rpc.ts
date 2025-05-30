import * as s from "../lib";
import { McpError } from "./error";
import type { McpServer } from "./server";

const anyObject = s.record(s.any());

const rpcBase = s.object({
   jsonrpc: s.string({ const: "2.0" }),
   id: s.oneOf([s.string(), s.number()]).optional(),
});

const rpcRequest = s.object({
   ...rpcBase.properties,
   method: s.string(),
   params: anyObject.optional(),
});

const rpcResponse = s.object({
   ...rpcBase.properties,
   result: anyObject.optional(),
   error: s.object({}).optional(),
});

export type TRpcRequest = s.Static<typeof rpcRequest>;
export type TRpcRequestP<S extends s.TSchema> = TRpcRequest & {
   params: s.Static<S>;
};
export type TRpcResponse = s.Static<typeof rpcResponse>;
export type TRpcMessage = TRpcRequest | TRpcResponse;
export type TRpcId = string | number;

export abstract class RpcMessage<
   Method extends string = string,
   Params extends s.TSchema = s.TSchema
> {
   abstract readonly method: Method;
   abstract readonly params: Params;

   constructor(protected readonly server: McpServer) {}

   is(message: TRpcRequest) {
      if (message.jsonrpc !== "2.0") {
         throw new McpError(
            "InvalidRequest",
            {
               expected: "2.0",
               actual: message.jsonrpc,
            },
            "Invalid JSON-RPC version"
         );
      }
      if (message.method !== this.method) {
         return false;
      }
      if (!this.params.validate(message.params).valid) {
         throw new McpError("InvalidParams", {
            expected: this.params.toJSON(),
            actual: message.params ?? null,
         });
      }
      return true;
   }

   abstract respond(message: TRpcRequest): Promise<TRpcResponse>;

   protected formatRespond(
      message: TRpcRequest,
      result: s.Static<Params>
   ): TRpcResponse {
      return {
         jsonrpc: "2.0",
         id: message.id,
         result,
      } as any; // @todo: fix
   }
}

export abstract class RpcNotification<
   Method extends string = string
> extends RpcMessage<Method> {
   override readonly params = s.any();

   constructor(server: McpServer) {
      super(server);
   }

   abstract handle(message: TRpcRequest): Promise<void>;

   override async respond(message: TRpcRequest) {
      await this.handle(message);
      return null as any;
   }
}
