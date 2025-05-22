import type { TObject, TSchema } from "../../lib";
import * as t from "./types";

export function isPlainObject(
   value: unknown
): value is Record<string, unknown> {
   return Object.prototype.toString.call(value) === "[object Object]";
}

export function isObject(value: unknown): value is Record<string, unknown> {
   return value !== null && typeof value === "object";
}

export function merge(obj: any, ...sources: any[]) {
   for (const source of sources) {
      for (const [key, value] of Object.entries(source)) {
         if (value === undefined) {
            continue;
         }

         // These checks are a week attempt at mimicking the various edge-case behaviors
         // that Lodash's `_.merge()` exhibits. Feel free to simplify and
         // remove checks that you don't need.
         if (!isPlainObject(value) && !Array.isArray(value)) {
            obj[key] = value;
         } else if (Array.isArray(value) && !Array.isArray(obj[key])) {
            obj[key] = value;
         } else if (!isObject(obj[key])) {
            obj[key] = value;
         } else {
            merge(obj[key], value);
         }
      }
   }

   return obj;
}

const honoTargetToParameterin = {
   query: "query",
   param: "path",
   header: "header",
   cookie: "cookie",
} as const;

const honoTargetToRequestBody = {
   json: {
      type: "application/json",
   },
   form: {
      type: "multipart/form-data",
   },
} as const;

export function schemaToSpec(
   obj: TObject<Record<string, TSchema>>,
   target: string
): Omit<t.OperationObject, "responses"> {
   const _in = honoTargetToParameterin[target];
   const _requestBody = honoTargetToRequestBody[target];

   if (_in) {
      return {
         parameters: Object.entries(obj.properties).map(([key, subSchema]) => {
            return {
               name: key,
               in: _in,
               required: obj.required?.includes(key) ?? false,
               schema: subSchema.toJSON(),
            };
         }),
      };
   } else if (_requestBody) {
      return {
         requestBody: {
            content: {
               [_requestBody.type]: { schema: obj.toJSON() },
            },
         },
      };
   }

   return {};
}
