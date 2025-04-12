import { $kind, $optional, type Static, type TSchema } from "../base";
import type { ObjectSchema } from "../types";

export type TPropertyKey = string;
export type TProperties = Record<TPropertyKey, TSchema>;

type ObjectStatic<T extends TProperties> = {
   [K in keyof T]: Static<T[K]>;
};

export interface TObject<T extends TProperties> extends TSchema {
   type: "object";
   properties: T;
   static: ObjectStatic<T>;
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

   return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
      [$kind]: "object",
      ...options,
   } as any;
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
   return {
      type: "object",
      properties,
      required: undefined,
      [$kind]: "object",
      ...options,
   } as any;
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
   return {
      [$kind]: "any",
   } as any;
};
