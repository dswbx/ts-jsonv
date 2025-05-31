import {
   type TSchema,
   type TSchemaTemplateOptions,
   schema,
   type TCustomSchema,
   type TCustomType,
   type TAnySchema,
} from "../schema";
import type {
   Merge,
   OptionalUndefined,
   Simplify,
   Static,
   StaticCoerced,
} from "../static";
import { $optional } from "../symbols";
import { invariant, isSchema, isValidPropertyName } from "../utils";
import type { CoercionOptions } from "../validation/coerce";

export type PropertyName = string;
export type TProperties = { [key in PropertyName]: TSchema };

type ObjectStatic<T extends TProperties> = Simplify<
   OptionalUndefined<{
      [K in keyof T]: Static<T[K]>;
   }>
>;
type ObjectCoerced<T extends TProperties> = Simplify<
   OptionalUndefined<{
      [K in keyof T]: StaticCoerced<T[K]>;
   }>
>;

export interface ObjectSchema extends TCustomType {
   $defs?: Record<string, TSchema>;
   patternProperties?: { [key: string]: TSchema };
   additionalProperties?: TSchema | false;
   minProperties?: number;
   maxProperties?: number;
   propertyNames?: TSchema;
}

export type TObject<
   P extends TProperties,
   O extends ObjectSchema = ObjectSchema,
   Out = O extends { additionalProperties: false }
      ? ObjectStatic<P>
      : Merge<ObjectStatic<P> & { [key: string]: unknown }>
> = Omit<TCustomSchema<O, Out>, "properties"> & {
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

   const additionalProperties =
      options.additionalProperties === false
         ? schema(false)
         : options.additionalProperties;

   return schema(
      {
         template,
         coerce,
         ...options,
         additionalProperties,
         type: "object",
         properties,
         required: required.length > 0 ? required : undefined,
      },
      "object"
   ) as any;
};

export const strictObject = <
   P extends TProperties,
   const O extends Omit<ObjectSchema, "additionalProperties">
>(
   properties: P,
   options: O = {} as O
): TObject<P, Merge<O & { additionalProperties: false }>> => {
   return object(properties, {
      ...options,
      additionalProperties: false,
   }) as any;
};

type PartialObjectStatic<T extends TProperties> = {
   [K in keyof T]?: Static<T[K]>;
};

type PartialObjectCoerced<T extends TProperties> = {
   [K in keyof T]?: StaticCoerced<T[K]>;
};

export type TPartialObject<
   P extends TProperties,
   O extends ObjectSchema,
   Out = O extends { additionalProperties: false }
      ? PartialObjectStatic<P>
      : Merge<PartialObjectStatic<P> & { [key: string]: unknown }>
> = Omit<TCustomSchema<O, Out>, "properties"> & {
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

export interface RecordSchema extends TCustomType {
   additionalProperties: never;
}

type RecordStatic<AP extends TAnySchema> = Record<string, Static<AP>>;

export type TRecord<AP extends TAnySchema, O extends RecordSchema> = Omit<
   TCustomSchema<O, RecordStatic<AP>>,
   "additionalProperties"
> & {
   additionalProperties: AP;
};

export const record = <
   const AP extends TAnySchema,
   const O extends RecordSchema
>(
   ap: AP,
   options: O = {} as O
): TRecord<AP, O> => {
   return schema(
      {
         template,
         coerce,
         ...options,
         type: "object",
         additionalProperties: ap,
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
   //console.log("object:coerce", { _value, type: typeof _value });
   let value = _value;
   if (typeof value === "string") {
      // if stringified object
      if (value.match(/^\{/) || value.match(/^\[/)) {
         value = JSON.parse(value);
      }
   }

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
