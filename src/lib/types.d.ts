export type JSONSchemaTypeName =
   | "string"
   | "number"
   | "integer"
   | "boolean"
   | "object"
   | "array"
   | "null"
   | string;

export type JSONSchemaDefinition = JSONSchema | boolean;
export type PropertyName = string;

export type BaseJSONSchema = {
   $id?: string;
   $ref?: string;
   $schema?: string;
   title?: string;
   description?: string;
   default?: any;
   readOnly?: boolean;
   writeOnly?: boolean;

   // Definitions
   definitions?: { [key in PropertyName]: JSONSchemaDefinition };
   $comment?: string;

   // Data types
   type?: JSONSchemaTypeName | JSONSchemaTypeName[];
   enum?: readonly any[] | any[];
   const?: any;
};

export type StringSchema = BaseJSONSchema & {
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;
};

export type NumberSchema = BaseJSONSchema & {
   multipleOf?: number;
   maximum?: number;
   exclusiveMaximum?: number;
   minimum?: number;
   exclusiveMinimum?: number;
};

export type BooleanSchema = BaseJSONSchema & {
   const?: boolean;
   default?: boolean;
};

export type ArraySchema = BaseJSONSchema & {
   items?: JSONSchemaDefinition | JSONSchemaDefinition[];
   additionalItems?: JSONSchemaDefinition;
   uniqueItems?: boolean;
   maxItems?: number;
   minItems?: number;
};

export type ObjectSchema = BaseJSONSchema & {
   properties?: { [key in PropertyName]: JSONSchemaDefinition };
   patternProperties?: { [key in PropertyName]: JSONSchemaDefinition };
   additionalProperties?: JSONSchemaDefinition;
   required?: PropertyName[];
   maxProperties?: number;
   minProperties?: number;
   dependencies?: {
      [key in PropertyName]: JSONSchemaDefinition | PropertyName[];
   };
};

export interface JSONSchema
   extends BaseJSONSchema,
      StringSchema,
      NumberSchema,
      BooleanSchema,
      ArraySchema,
      ObjectSchema {
   // Combining schemas
   allOf?: JSONSchemaDefinition[];
   anyOf?: JSONSchemaDefinition[];
   oneOf?: JSONSchemaDefinition[];
   not?: JSONSchemaDefinition;
   if?: JSONSchemaDefinition;
   then?: JSONSchemaDefinition;
   else?: JSONSchemaDefinition;

   // catch-all for custom extensions
   [key: string | symbol]: any;
}
