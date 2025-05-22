import type { Env, Hono } from "hono";
import type { BlankEnv, MiddlewareHandler } from "hono/types";
import { $symbol } from "../shared";
import type { DescribeRouteOptions } from "./types";
import type { OpenAPIV3 } from "openapi-types";
import { merge, schemaToSpec } from "./utils";

export const openAPISpecs = <
   E extends Env = BlankEnv,
   P extends string = string
>(
   hono: Hono<E>,
   specs: Partial<OpenAPIV3.Document> = {} as OpenAPIV3.Document
) => {
   specs.paths = specs.paths ?? {};

   for (const route of hono.routes) {
      if ($symbol in route.handler) {
         const method = route.method.toLowerCase();
         const path = route.path;
         const { type, value } = route.handler[$symbol] as any;
         if (!specs.paths[path]) {
            specs.paths[path] = {};
         }
         if (!specs.paths[path][method]) {
            specs.paths[path][method] = {};
         }
         const obj = specs.paths[path][method];

         switch (type) {
            case "parameters":
               const { parameters, requestBody } = schemaToSpec(
                  value.schema,
                  value.target
               );

               if (parameters) {
                  if (!obj.parameters) {
                     obj.parameters = [];
                  }
                  obj.parameters.push(...parameters);
               }

               if (requestBody) {
                  if (!obj.requestBody) {
                     obj.requestBody = {};
                  }
                  merge(obj.requestBody, requestBody);
               }

               break;
            case "route-doc":
               merge(specs.paths[path][method], value);
               break;
         }
      }
   }

   return async (c) => {
      return c.json({
         openapi: "3.0.0",
         info: {
            title: "API",
            version: "0.0.0",
            ...specs.info,
         },
         ...specs,
      });
   };
};

export const describeRoute = <
   E extends Env = BlankEnv,
   P extends string = string
>(
   specs: DescribeRouteOptions
) => {
   const handler: MiddlewareHandler<E, P> = async (c, next) => {
      await next();
   };

   return Object.assign(handler, {
      [$symbol]: {
         type: "route-doc",
         value: specs,
      },
   });
};
