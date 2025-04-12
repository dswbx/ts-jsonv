# jsonschema-ts

A radically simple and lightweight (1kb minified) TypeScript library for defining JSON schemas with static type inference. Nothing more, nothing less. The schemas composed can be used with any JSON schema validator, it strips all metadata when being JSON stringified.

## Overview

`jsonschema-ts` allows you to define JSON schemas using a TypeScript API. It provides functions for all standard JSON schema types (`object`, `string`, `number`, `array`, `boolean`) as well as common patterns like `optional` fields, union types (`anyOf`, `oneOf`, and `allOf`), and constants/enums. The `Static` type helper infers the corresponding TypeScript type directly from your schema definition.

-  Type-safe JSON schema definition in TypeScript.
-  Static type inference from schemas using the `Static` helper.
-  Support for standard JSON schema types and keywords.
-  Simple API for schema construction.

## Installation

```bash
npm install jsonschema-ts
```

## Example

```ts
import * as s from "jsonschema-ts";

const UserSchema = s.object({
   id: s.number(),
   username: s.string({ minLength: 3 }),
   email: s.optional(s.string({ format: "email" })),
});
// {
//    "type": "object",
//    "properties": {
//       "id": { "type": "number" },
//       "username": { "type": "string", "minLength": 3 },
//       "email": { "type": "string", "format": "email" }
//    },
//    "required": ["id", "username"]
// }

// Infer the TypeScript type from the schema
type User = s.Static<typeof UserSchema>;

// Example usage:
const user: User = {
   id: 123,
   username: "john_doe",
   // email is optional
};

// Type checking works as expected:
// const invalidUser: User = { id: 'abc', username: 'jd' }; // Type error
```

## API Reference

Below are the primary functions for building schemas:

### `string(schema?: StringSchema)`

Defines a string type. Optional `schema` can include standard JSON schema string constraints like `minLength`, `maxLength`, `pattern`, `format`, etc.

```ts
import * as s from "jsonschema-ts";

const EmailSchema = s.string({ format: "email" });
// { type: "string", format: "email" }

type Email = s.Static<typeof EmailSchema>; // string
```

### `number(schema?: NumberSchema)`

Defines a number type. Optional `schema` can include `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`.

```ts
import * as s from "jsonschema-ts";

const PositiveNumberSchema = s.number({ minimum: 0 });
// { type: "number", minimum: 0 }

type PositiveNumber = s.Static<typeof PositiveNumberSchema>; // number
```

### `integer(schema?: NumberSchema)`

Defines an integer type. This is a shorthand for `s.number({ type: "integer", ...props })`.

```ts
import * as s from "jsonschema-ts";

const IdSchema = s.integer({ minimum: 1 });
// { type: "integer", minimum: 1 }

type Id = s.Static<typeof IdSchema>; // number
```

### `boolean(schema?: BooleanSchema)`

Defines a boolean type.

```ts
import * as s from "jsonschema-ts";

const ActiveSchema = s.boolean();
// { type: "boolean" }

type Active = s.Static<typeof ActiveSchema>; // boolean
```

### `array(items: TSchema, schema?: ArraySchema)`

Defines an array type where all items must match the `items` schema. Optional `schema` can include `minItems`, `maxItems`, `uniqueItems`.

```ts
import * as s from "jsonschema-ts";

const TagsSchema = s.array(s.string({ minLength: 1 }), { minItems: 1 });
// { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 }

type Tags = s.Static<typeof TagsSchema>; // string[]
```

### `object(properties: Record<string, TSchema>, schema?: ObjectSchema)`

Defines an object type with named `properties`. By default, all properties defined are required. Use `s.optional()` to mark properties as optional. Optional `schema` can include `required`, `additionalProperties`, `minProperties`, `maxProperties`.

```ts
import * as s from "jsonschema-ts";

const ProductSchema = s.object({
   productId: s.integer(),
   name: s.string(),
   price: s.number({ minimum: 0 }),
   description: s.optional(s.string()), // Optional property
});
// {
//   type: 'object',
//   properties: {
//     productId: { type: 'integer' },
//     name: { type: 'string' },
//     price: { type: 'number', minimum: 0 },
//     description: { type: 'string' }
//   },
//   required: [ 'productId', 'name', 'price' ]
// }

type Product = s.Static<typeof ProductSchema>;
// {
//   productId: number;
//   name: string;
//   price: number;
//   description?: string | undefined;
// }
```

### Unions (`anyOf`, `oneOf`, `allOf`)

Combine multiple schemas using union keywords:

-  `anyOf(schemas: TSchema[])`: Must match at least one of the provided schemas.
-  `oneOf(schemas: TSchema[])`: Must match exactly one of the provided schemas.
-  `allOf(schemas: TSchema[])`: Must match all of the provided schemas.

```ts
import * as s from "jsonschema-ts";

const StringOrNumberSchema = s.anyOf([s.string(), s.number()]);
// { anyOf: [ { type: 'string' }, { type: 'number' } ] }

type StringOrNumber = s.Static<typeof StringOrNumberSchema>; // string | number
```

## Validation

The schemas created with `jsonschema-ts` are standard JSON Schema objects and can be used with any compliant validator. The library ensures that when the schema object is converted to JSON (e.g., using `JSON.stringify`), only standard JSON Schema properties are included, stripping any internal metadata. For the examples, this is going to be the base schema object.

```ts
const UserSchema = s.object({
   id: s.integer({ minimum: 1 }),
   username: s.string({ minLength: 3 }),
   email: s.optional(s.string({ format: "email" })),
});
// { id: number, username: string, email?: string }
```

Here are examples using popular validation libraries:

### Using `ajv`

```ts
import Ajv from "ajv";
import addFormats from "ajv-formats";

// ... example code from above

const ajv = new Ajv();
addFormats(ajv); // Recommended for formats like 'email'

const validate = ajv.compile(UserSchema);

const validUser = { id: 1, username: "valid_user", email: "test@example.com" };
const invalidUser = { id: 0, username: "no" }; // Fails minimum and minLength

console.log(validate(validUser)); // true
console.log(validate(invalidUser)); // false
```

### Using `@cfworker/json-schema`

This validator is designed for environments like Cloudflare Workers and is also standards-compliant.

```ts
import { Validator } from "@cfworker/json-schema";
import * as s from "jsonschema-ts";

const validator = new Validator();

// Assume UserSchema is defined as in the common example above

// Validate data directly against the schema
const validUser = { id: 1, username: "valid_user", email: "test@example.com" };
const invalidUser = { id: 0, username: "no" };

const resultValid = validator.validate(validUser, UserSchema);
console.log(resultValid.valid); // true
// For errors: console.log(resultValid.errors);

const resultInvalid = validator.validate(invalidUser, UserSchema);
console.log(resultInvalid.valid); // false
// For errors: console.log(resultInvalid.errors);
```

## Development

This project uses `bun` for package management and task running.

-  **Install dependencies:** `bun install`
-  **Run tests:** `bun test` (runs both type checks and unit tests)
-  **Run unit tests:** `bun test:unit`
-  **Run type checks:** `bun test:types`
-  **Build the library:** `bun build` (output goes to the `dist` directory)

## License

MIT

## Acknowledgements

-  [TypeBox](https://github.com/sinclairzx81/typebox) for the inspiration, ideas, and some type inference snippets
