import * as s from "jsonv-ts";
import { RpcMessage, type TRpcRequest } from "../rpc";

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
            type: s.stringConst("ref/resource"),
            uri: s.string(),
         }),
         s.object({
            type: s.stringConst("ref/tool"),
            name: s.string(),
         }),
      ]),
   });

   override async respond(message: TRpcRequest) {
      return this.formatRespond(message, {
         completion: {
            values: [],
            total: 0,
            hasMore: false,
         },
      });
   }
}
