import {
   $kind,
   $optional,
   type Static,
   type TSchema,
   type TSchemaTemplateOptions,
   create,
} from "../base";
import type { ObjectSchema } from "../types";

export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]>;
};

export interface TObject<T extends TProperties> extends TSchema<"object"> {
   type: "object";
   properties: T;
   static: ObjectStatic<T>;
   required?: string[] | undefined;
}

export const object = <
   P extends TProperties,
   O extends Omit<ObjectSchema, "properties" | "required">
>(
   properties: P,
   options?: O
): TObject<P> => {
   const required = Object.entries(properties)
      .filter(([, value]) => !($optional in value))
      .map(([key]) => key);

   return create<TObject<P>>("object", {
      ...options,
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
      validate,
      template,
   });
};

export const strictObject = <
   P extends TProperties,
   O extends Omit<ObjectSchema, "properties" | "required">
>(
   properties: P,
   options?: O
): TObject<P> => {
   return object(properties, {
      ...options,
      additionalProperties: false,
   }) as any;
};

type PartialObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]> | undefined;
};

export interface TPartialObject<T extends TProperties> extends TSchema {
   type: "object";
   properties: T;
   static: PartialObjectStatic<T>;
}

export const partialObject = <
   P extends TProperties,
   O extends Omit<ObjectSchema, "properties" | "required">
>(
   properties: P,
   options?: O
): TPartialObject<P> => {
   return create<TPartialObject<P>>("object", {
      ...options,
      type: "object",
      properties,
      validate,
      template,
   });
};

export const record = <
   P extends TProperties,
   O extends Omit<
      ObjectSchema,
      "properties" | "required" | "additionalProperties"
   >
>(
   properties: P,
   options?: O,
   apOptions?: Omit<ObjectSchema, "properties" | "required">
): TObject<P> => {
   return object(
      {},
      {
         ...options,
         additionalProperties: object(properties, apOptions),
      }
   ) as any;
};

export interface TAny extends TSchema {
   static: any;
}

export const any = (): TAny => {
   return create<TAny>("any", {
      validate: () => undefined,
   });
};

function validate(this: ObjectSchema, value: unknown): string | void {
   if (typeof value !== "object" || value === null) {
      return "type";
   }

   if (this.required) {
      for (const key of this.required) {
         if (!(key in value)) {
            return `required.${key}`;
         }
      }
   }

   if (this.properties) {
      for (const [key, property] of Object.entries(this.properties)) {
         // @ts-ignore
         const error = property.validate(value[key]);
         if (error) {
            return error;
         }
      }
   }

   // @todo: additionalProperties
   // @todo: patternProperties
   // @todo: minProperties
   // @todo: maxProperties
}

function template(this: ObjectSchema, opts: TSchemaTemplateOptions = {}) {
   if (this.default) return this.default;
   if (this.const) return this.const;

   const result: Record<string, unknown> = {};

   if (this.properties) {
      for (const [key, property] of Object.entries(this.properties)) {
         if (opts.withOptional !== true && !this.required?.includes(key)) {
            continue;
         }

         // @ts-ignore
         const value = property.template(opts);
         if (value !== undefined) {
            result[key] = value;
         }
      }
   }
   return result;
}
