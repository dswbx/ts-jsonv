import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "hono";
import type { Env, Input, BlankInput } from "hono/types";
import type {
   ClientErrorStatusCode,
   ServerErrorStatusCode,
} from "hono/utils/http-status";

export type DescribeRouteOptions = Omit<
   OpenAPIV3.OperationObject,
   "responses" | "parameters"
> & {
   /**
    * Pass `true` to hide route from OpenAPI/swagger document
    */
   hide?:
      | boolean
      | (<
           E extends Env = Env,
           P extends string = string,
           I extends Input = BlankInput
        >(
           c: Context<E, P, I>
        ) => boolean);

   /**
    * Validate response of the route
    */
   validateResponse?:
      | boolean
      | {
           status: ClientErrorStatusCode | ServerErrorStatusCode;
           message?: string;
        };

   /**
    * Responses of the request
    */
   responses?: {
      [key: string]:
         | (OpenAPIV3.ResponseObject & {
              content?: {
                 [key: string]: Omit<OpenAPIV3.MediaTypeObject, "schema"> & {
                    schema?: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
                 };
              };
           })
         | OpenAPIV3.ReferenceObject;
   };

   /**
    * Parameters of the request
    */
   parameters?: OpenAPIV3.ParameterObject[];
};
