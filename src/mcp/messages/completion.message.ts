import * as s from "jsonv-ts";
import { RpcMessage, type TRpcRequest, type TRpcRequestP } from "../rpc";

// currently just a placeholder to prevent errors

export class CompletionMessage extends RpcMessage {
   method = "completion/complete";
   params = s.object({
      argument: s.object({
         name: s.string(),
         value: s.string(),
      }),
      ref: s.oneOf([
         s.object({
            type: s.string({ const: "ref/resource" }),
            uri: s.string(),
         }),
         s.object({
            type: s.string({ const: "ref/tool" }),
            name: s.string(),
         }),
      ]),
   });

   override async respond(message: TRpcRequestP<typeof this.params>) {
      return this.formatRespond(message, {
         completion: {
            values: [],
            total: 0,
            hasMore: false,
         },
      });
   }
}
