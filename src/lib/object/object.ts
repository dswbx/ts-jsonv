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
   [K in keyof T]?: Static<T[K]>;
};

type PartialObjectCoerced<T extends TProperties> = {
   [K in keyof T]?: StaticCoerced<T[K]>;
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

export interface RecordSchema extends Partial<TSchema> {
   additionalProperties: never;
}

type RecordStatic<A extends TSchema> = Record<string, Static<A>>;

export type TRecord<A extends TSchema, O extends RecordSchema> = Omit<
   TCustomSchema<O, RecordStatic<A>>,
   "additionalProperties"
> & {
   additionalProperties: A;
};

export const record = <
   const S extends TSchema,
   const O extends RecordSchema
>(
   ap: S,
   options: O = {} as O
): TRecord<S, O> => {
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
