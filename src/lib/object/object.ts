import {
   type TSchema,
   type TSchemaTemplateOptions,
   schema,
   type TCustomSchema,
} from "../schema";
import type {
   OptionalUndefined,
   Simplify,
   Static,
   StaticCoersed,
} from "../static";
import { $optional } from "../symbols";
import { invariant, isSchema, isValidPropertyName } from "../utils";
import type { CoercionOptions } from "../validation/coerse";

export type PropertyName = string;
export type TProperties = { [key in PropertyName]: TSchema };

type ObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]>;
};
type ObjectCoerced<T extends TProperties> = {
   [K in keyof T]: StaticCoersed<T[K]>;
};

export interface ObjectSchema extends Omit<Partial<TSchema>, "properties"> {
   patternProperties?: { [key: string]: TSchema };
   additionalProperties?: TSchema;
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: TSchema;
}

export type TObject<
   P extends TProperties,
   O extends ObjectSchema = ObjectSchema
> = Omit<TCustomSchema<O, ObjectStatic<P>>, "properties"> & {
   properties: P;
   coerce: (value: unknown) => ObjectCoerced<P>;
};

export const object = <P extends TProperties, const O extends ObjectSchema>(
   properties: P,
   options: O = {} as O
): TObject<P, O> => {
   for (const key of Object.keys(properties || {})) {
      invariant(isValidPropertyName(key), "invalid property name", key);
      invariant(
         isSchema(properties[key]),
         "properties must be managed schemas",
         properties[key]
      );
   }

   const required = Object.entries(properties || {})
      .filter(([, value]) => !($optional in value))
      .map(([key]) => key);

   return schema(
      {
         template,
         coerce,
         ...options,
         type: "object",
         properties,
         required: required.length > 0 ? required : undefined,
      },
      "object"
   ) as any;
};

export const strictObject = <
   P extends TProperties,
   const O extends ObjectSchema & { additionalProperties?: false }
>(
   properties: P,
   options: O = {} as O
): TObject<P, O> => {
   return object(properties, {
      ...options,
      additionalProperties: schema(false),
   }) as any;
};

type PartialObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]> | undefined;
};

type PartialObjectCoerced<T extends TProperties> = {
   [K in keyof T]: StaticCoersed<T[K]> | undefined;
};

export type TPartialObject<
   P extends TProperties,
   O extends ObjectSchema
> = Omit<TCustomSchema<O, PartialObjectStatic<P>>, "properties"> & {
   properties: P;
   coerce: (
      value: unknown
   ) => Simplify<OptionalUndefined<PartialObjectCoerced<P>>>;
};

export const partialObject = <
   P extends TProperties,
   const O extends ObjectSchema
>(
   properties: P,
   options: O = {} as O
): TPartialObject<P, O> => {
   const partial = Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [
         key,
         // @ts-ignore
         "optional" in value ? value.optional() : value,
      ])
   );

   return object(partial, options) as any;
};

type RecordStatic<T extends TProperties> = Record<string, Static<TObject<T>>>;

export interface RecordSchema extends Partial<TSchema> {
   additionalProperties: never;
}

export type TRecord<P extends TProperties, O extends RecordSchema> = Omit<
   TCustomSchema<O, RecordStatic<P>>,
   "additionalProperties"
> & {
   additionalProperties: TObject<P>;
};

export const record = <P extends TProperties, const O extends RecordSchema>(
   properties: P,
   options: O = {} as O,
   apOptions?: Omit<ObjectSchema, "properties" | "required">
): TRecord<P, O> => {
   return schema(
      {
         template,
         coerce,
         ...options,
         type: "object",
         additionalProperties: object(properties, apOptions),
      },
      "object"
   ) as any;
};

function template(this: TSchema, opts: TSchemaTemplateOptions = {}) {
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

function coerce(this: TSchema, _value: unknown, opts: CoercionOptions = {}) {
   const value = typeof _value === "string" ? JSON.parse(_value) : _value;

   if (typeof value !== "object" || value === null) {
      return undefined;
   }

   if (this.properties) {
      for (const [key, property] of Object.entries(this.properties)) {
         const v = value[key];
         if (v !== undefined) {
            // @ts-ignore
            value[key] = property.coerce(v, opts);
         }
      }
   }

   return value;
}
