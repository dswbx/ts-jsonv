import {
   $optional,
   type Static,
   type TSchema,
   type TSchemaTemplateOptions,
   type TSchemaWithFn,
   create,
} from "../base";
import type { ObjectSchema } from "../types";
import { invariant, isSchema, isValidPropertyName } from "../utils";

export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]>;
};

export interface TObject<T extends TProperties>
   extends TSchema<"object">,
      ObjectSchema {
   type: "object";
   properties: T;
   static: ObjectStatic<T>;
   required?: string[] | undefined;
}

export const object = <
   P extends TProperties,
   O extends TSchemaWithFn<Omit<ObjectSchema, "properties" | "required">>
>(
   properties: P,
   options?: O
) => {
   for (const key of Object.keys(properties)) {
      invariant(isValidPropertyName(key), "invalid property name");
      invariant(isSchema(properties[key]), "invalid property schema");
   }

   const required = Object.entries(properties)
      .filter(([, value]) => !($optional in value))
      .map(([key]) => key);

   return create<TObject<P>>("object", {
      validate,
      template,
      coerce,
      ...options,
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
   });
};

export const strictObject = <
   P extends TProperties,
   O extends TSchemaWithFn<Omit<ObjectSchema, "properties" | "required">>
>(
   properties: P,
   options?: O
) => {
   return object(properties, {
      ...options,
      additionalProperties: false,
   });
};

type PartialObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]> | undefined;
};

export interface TPartialObject<T extends TProperties>
   extends TSchema<"object">,
      ObjectSchema {
   type: "object";
   properties: T;
   static: PartialObjectStatic<T>;
}

export const partialObject = <
   P extends TProperties,
   O extends TSchemaWithFn<Omit<ObjectSchema, "properties" | "required">>
>(
   properties: P,
   options?: O
) => {
   return create<TPartialObject<P>>("object", {
      validate,
      template,
      coerce,
      ...options,
      type: "object",
      properties,
   });
};

export interface TRecord<T extends TProperties>
   extends TSchema<"object">,
      ObjectSchema {
   type: "object";
   additionalProperties: TObject<T>;
   static: Record<string, Static<TObject<T>>>;
}

export const record = <
   P extends TProperties,
   O extends TSchemaWithFn<
      Omit<ObjectSchema, "required" | "additionalProperties">
   >
>(
   properties: P,
   options?: O,
   apOptions?: Omit<ObjectSchema, "properties" | "required">
) => {
   return create<TRecord<P>>("object", {
      validate,
      template,
      coerce,
      ...options,
      type: "object",
      additionalProperties: object(properties, apOptions),
   });
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

   const properties = {
      ...this.properties,
      ...(typeof this.additionalProperties === "object"
         ? this.additionalProperties.properties
         : {}),
   };

   if (properties) {
      for (const [key, property] of Object.entries(properties)) {
         // @ts-ignore
         const error = property.validate(value[key]);
         if (error) {
            return error;
         }
      }
   }

   // @todo: patternProperties
   // @todo: propertyNames
   const todo = ["patternProperties", "propertyNames"];
   for (const item of todo) {
      if (this[item]) {
         throw new Error(`${item} not implemented`);
      }
   }

   const prop_names = Object.keys(properties);
   const prop_names_length = prop_names.length;
   if (this.minProperties && prop_names_length < this.minProperties) {
      return "minProperties";
   }

   if (this.maxProperties && prop_names_length > this.maxProperties) {
      return "maxProperties";
   }
}

function template(this: ObjectSchema, opts: TSchemaTemplateOptions = {}) {
   if (this.default) return this.default;
   if (this.const) return this.const;

   const result: Record<string, unknown> = {};
   const properties = {
      ...this.properties,
      ...(typeof this.additionalProperties === "object"
         ? this.additionalProperties.properties
         : {}),
   };

   if (properties) {
      for (const [key, property] of Object.entries(properties)) {
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

function coerce(this: ObjectSchema, _value: unknown) {
   const value = typeof _value === "string" ? JSON.parse(_value) : _value;

   if (typeof value !== "object" || value === null) {
      return undefined;
   }

   const properties = {
      ...this.properties,
      ...(typeof this.additionalProperties === "object"
         ? this.additionalProperties.properties
         : {}),
   };

   if (properties) {
      for (const [key, property] of Object.entries(properties)) {
         const v = value[key];
         if (v !== undefined) {
            // @ts-ignore
            value[key] = property.coerce(v);
         }
      }
   }

   return value;
}
