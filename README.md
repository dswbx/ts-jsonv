[![npm version](https://img.shields.io/npm/v/jsonv-ts.svg)](https://npmjs.org/package/jsonv-ts)
![gzipped size of jsonv-ts](https://img.badgesize.io/https://unpkg.com/jsonv-ts@latest/dist/lib/index.js?compression=gzip&label=jsonv-ts)
![gzipped size of jsonv-ts/hono](https://img.badgesize.io/https://unpkg.com/jsonv-ts@latest/dist/hono/index.js?compression=gzip&label=jsonv-ts/hono)

# jsonv-ts: JSON Schema Builder and Validator for TypeScript

<!-- TOC depthfrom:2 updateonsave:true -->

-  [Installation](#installation)
-  [Example](#example)
-  [Motivation](#motivation)
-  [Schema Types](#schema-types)
   -  [Strings](#strings)
   -  [Numbers](#numbers)
   -  [Integers](#integers)
   -  [Booleans](#booleans)
   -  [Literals](#literals)
   -  [Arrays](#arrays)
   -  [Objects](#objects)
      -  [Strict Object](#strict-object)
      -  [Partial Object](#partial-object)
      -  [Record](#record)
   -  [Unions](#unions)
   -  [Any](#any)
   -  [From Schema](#from-schema)
   -  [Custom Schemas](#custom-schemas)
-  [Hono Integration](#hono-integration)
   -  [Validator Middleware](#validator-middleware)
   -  [OpenAPI generation](#openapi-generation)
-  [Validation](#validation)
   -  [Integrated Validator](#integrated-validator)
   -  [Using ajv](#using-ajv)
   -  [Using @cfworker/json-schema](#using-cfworkerjson-schema)
   -  [Using json-schema-library](#using-json-schema-library)
-  [Development](#development)
-  [License](#license)
-  [Acknowledgements](#acknowledgements)

<!-- /TOC -->

A simple, lightweight (~6kb gzipped) and dependency-free TypeScript library for defining and validating JSON schemas with static type inference. The schemas composed can be used with any JSON schema validator, it strips all metadata when being JSON stringified. It has an integrated validator that can be used to validate instances against the latest JSON schema draft (2020-12).

`jsonv-ts` allows you to define JSON schemas using a TypeScript API. It provides functions for all standard JSON schema types (`object`, `string`, `number`, `array`, `boolean`) as well as common patterns like `optional` fields, union types (`anyOf`, `oneOf`, and `allOf`), and constants/enums. The `Static` type helper infers the corresponding TypeScript type directly from your schema definition.

-  Type-safe JSON schema definition in TypeScript.
-  Static type inference from schemas using the `Static` helper.
-  Support for standard JSON schema types and keywords.
-  Hono integration for OpenAPI generation and request validation.
-  MCP server implementation.

## Installation

```bash
npm install jsonv-ts
```

## Example

```ts
import * as s from "jsonv-ts";

const schema = s.object({
   id: s.number(),
   username: s.string({ minLength: 3 }),
   email: s.string({ format: "email" }).optional(),
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
type User = s.Static<typeof schema>;
// { id: number; username: string; email?: string | undefined }

// Example usage:
const user: User = {
   id: 123,
   username: "john_doe",
   // email is optional
};

// Type checking works as expected:
// const invalidUser: User = { id: 'abc', username: 'jd' }; // Type error

// Use the integrated validation
const result = schema.validate(user);
// { valid: true, errors: [] }

const result2 = schema.validate({ id: 1 });
// {
//  "valid": false,
//  "errors": [
//    {
//      "keywordLocation": "/required",
//      "instanceLocation": "/",
//      "error": "Expected object with required properties id, username",
//      "data": {
//        "id": 1
//      }
//    }
//  ]
// }
```

## Motivation

If you validate schemas only within the same code base and need comprehensive functionality, you might be better off choosing another library such as zod, TypeBox, etc.

But if you need controllable and predictable schema validation, this library is for you. I was frustrated about the lack of adherence to the JSON schema specification in other libraries, so I decided to create this library. Furthermore, most of the other libraries may reduce your IDE performance due to the sheer number of features they provide.

JSON Schema is simple, elegant and well-defined, so why not use it directly?

## Schema Types

Below are the primary functions for building schemas:

### Strings

Defines a string type. Optional `schema` can include standard JSON schema string constraints like `minLength`, `maxLength`, `pattern`, `format`, etc.

```ts
const schema = s.string({ format: "email" });
// { type: "string", format: "email" }

type Email = s.Static<typeof schema>; // string
```

To define an Enum, you can add the `enum` property to the schema. It'll be inferred correctly.

```ts
const schema = s.string({ enum: ["red", "green", "blue"] });
// { type: "string", enum: [ "red", "green", "blue" ] }

type Color = s.Static<typeof schema>; // "red" | "green" | "blue"
```

The same applies to Constants:

```ts
const schema = s.string({ const: "active" });
// { type: "string", const: "active" }

type Status = s.Static<typeof schema>; // "active"
```

### Numbers

Defines a number type. Optional `schema` can include `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`.

```ts
const schema = s.number({ minimum: 0 });
// { type: "number", minimum: 0 }

type PositiveNumber = s.Static<typeof schema>; // number
```

Just like with Strings, you can use Enums and Constants with Numbers:

```ts
const enumSchema = s.number({ enum: [18, 21, 25] });
// { type: "number", enum: [ 18, 21, 25 ] }

type Age = s.Static<typeof enumSchema>; // 18 | 21 | 25

const constSchema = s.number({ const: 200 });
// { type: "number", const: 200 }

type Status = s.Static<typeof constSchema>; // 200
```

### Integers

Defines an integer type. This is a shorthand for `s.number({ type: "integer", ...props })`.

### Booleans

Defines a boolean type.

```ts
const schema = s.boolean();
// { type: "boolean" }

type Active = s.Static<typeof schema>; // boolean
```

### Literals

The `literal` schema type defines a schema that only accepts a specific value. It's useful for defining constants or enums with a single value.

```ts
const schema = s.literal(1);
// { const: 1 }

type One = s.Static<typeof schema>; // 1
```

It can be used with all primitive types, arrays and objects:

```ts
// String literal
const strSchema = s.literal("hello");
type Hello = s.Static<typeof strSchema>; // "hello"

// Number literal
const numSchema = s.literal(42);
type FortyTwo = s.Static<typeof numSchema>; // 42

// Boolean literal
const boolSchema = s.literal(true);
type True = s.Static<typeof boolSchema>; // true

// Null literal
const nullSchema = s.literal(null);
type Null = s.Static<typeof nullSchema>; // null

// Undefined literal
const undefSchema = s.literal(undefined);
type Undefined = s.Static<typeof undefSchema>; // undefined

// Object literal
const objSchema = s.literal({ name: "hello" });
type Obj = s.Static<typeof objSchema>; // { readonly name: "hello" }

// Array literal
const arrSchema = s.literal([1, "2", true]);
type Arr = s.Static<typeof arrSchema>; // readonly [1, "2", true]
```

You can also add additional schema properties:

```ts
const schema = s.literal(1, { title: "number" });
// { const: 1, title: "number" }
```

### Arrays

Defines an array type where all items must match the `items` schema.

```ts
const schema = s.array(s.string({ minLength: 1 }), { minItems: 1 });
// { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 }

type Tags = s.Static<typeof schema>; // string[]
```

### Objects

Defines an object type with named `properties`. By default, all properties defined are required. Use `optional()` to mark properties as optional.

```ts
const schema = s.object({
   productId: s.integer(),
   name: s.string(),
   price: s.number({ minimum: 0 }),
   description: s.string().optional(), // Optional property
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

type Product = s.Static<typeof schema>;
// {
//   productId: number;
//   name: string;
//   price: number;
//   description?: string | undefined;
//   [key: string]: unknown;
// }
```

#### Strict Object

You may also use the `s.strictObject()` function to create a strict object schema which sets `additionalProperties` to `false`.

```ts
const schema = s.strictObject({
   id: s.integer(),
   username: s.string().optional(),
});
// {
//   type: "object",
//   properties: {
//     id: { type: "integer" },
//     username: { type: "string" }
//   },
//   required: ["id"],
//   additionalProperties: false,
// }

type StrictProduct = s.Static<typeof schema>;
// {
//   productId: number;
//   name: string;
//   price: number;
//   description?: string | undefined;
// }
//
// note that `[key: string]: unknown` is not added to the type now

// it's equivalent to:
const schema = s.object(
   {
      id: s.integer(),
      username: s.string().optional(),
   },
   {
      additionalProperties: false,
   }
);
```

#### Partial Object

The `partialObject` function creates an object schema where all properties are optional. This is useful when you want to make all properties of an object optional without having to call `.optional()` on each property individually.

```ts
const schema = s.partialObject({
   name: s.string(),
   age: s.number(),
});
// {
//   type: "object",
//   properties: {
//     name: { type: "string" },
//     age: { type: "number" }
//   }
// }

type User = s.Static<typeof schema>;
// { name?: string; age?: number; [key: string]: unknown }
```

You can also combine it with `additionalProperties: false` to create a strict partial object:

```ts
const schema = s.partialObject(
   {
      name: s.string(),
      age: s.number(),
   },
   { additionalProperties: false }
);
// {
//   type: "object",
//   properties: {
//     name: { type: "string" },
//     age: { type: "number" }
//   },
//   additionalProperties: false
// }

type User = s.Static<typeof schema>;
// { name?: string; age?: number }
```

#### Record

Or for records, use `s.record()`.

```ts
const schema = s.record(s.string());
// {
//   type: "object",
//   additionalProperties: {
//     type: "string"
//   }
// }

type User = s.Static<typeof schema>;
// { [key: string]: string; [key: string]: unknown }
```

### Unions

Combine multiple schemas using union keywords:

-  `anyOf(schemas: TSchema[])`: Must match at least one of the provided schemas.
-  `oneOf(schemas: TSchema[])`: Must match exactly one of the provided schemas.
-  `allOf(schemas: TSchema[])`: Must match all of the provided schemas.

```ts
import * as s from "jsonv-ts";

const schema = s.anyOf([s.string(), s.number()]);
// { anyOf: [ { type: 'string' }, { type: 'number' } ] }

type StringOrNumber = s.Static<typeof schema>; // string | number
```

### Any

The `any` schema type allows any value to pass validation. It's useful when you need to accept any type of value in your schema.

```ts
const schema = s.any(); // {}
type AnyValue = s.Static<typeof schema>; // any
```

It can be used in objects to allow any type for a property:

```ts
const schema = s.object({
   name: s.any().optional(),
});
// {
//   type: "object",
//   properties: {
//     name: {}
//   }
// }

type User = s.Static<typeof schema>;
// { name?: any }
```

### From Schema

In case you need schema functionality such as validation of coercion, but only have raw JSON schema definitions, you may use `s.fromSchema()`:

```ts
const schema = s.fromSchema({
   type: "string",
   maxLength: 10,
});
```

There is no type inference, but it tries to read the schema added and maps it to the corresponding schema function. In this case, `s.string()` will be used. The benefit of using this function over `s.schema()` (described below) is that coercion logic is applied.

This function is mainly added to perform the tests against the JSON Schema Test Suite.

### Custom Schemas

In case you need to define a custom schema, e.g. without `type` to be added, you may simply use `s.schema()`:

```ts
const schema = s.schema({
   // any valid JSON schema object
   maxLength: 10,
});
```

It can also be used to define boolean schemas:

```ts
const alwaysTrue = s.schema(true);
const alwaysFalse = s.schema(false);
```

## Hono Integration

### Validator Middleware

If you're using [Hono](https://hono.dev/) and want to validate the request targets (query, body, etc.), you can use the `validator` middleware.

```ts
import { Hono } from "hono";
import { validator } from "jsonv-ts/hono";
import * as s from "jsonv-ts";

const app = new Hono().post(
   "/json",
   validator("json", s.object({ name: s.string() })),
   (c) => {
      const json = c.req.valid("json");
      //    ^? { name: string }
      return c.json(json);
   }
);
```

It also automatically coerces e.g. query parameters to the corresponding type.

```ts
import { Hono } from "hono";
import { validator } from "jsonv-ts/hono";
import * as s from "jsonv-ts";

const app = new Hono().get(
   "/query",
   validator("query", s.object({ count: s.number() })),
   (c) => {
      const query = c.req.valid("query");
      //    ^? { count: number }
      return c.json(query);
   }
);
```

### OpenAPI generation

Every route that uses the `validator` middleware will be automatically added to the OpenAPI specification. Additionally, you can use the `describeRoute` function to add additional information to the route, or add routes that don't use any validations:

```ts
import { Hono } from "hono";
import { describeRoute } from "jsonv-ts/hono";

const app = new Hono().get(
   "/",
   describeRoute({ summary: "Hello, world!" }),
   (c) => c.json({ foo: "bar" })
);
```

To then generate the OpenAPI specification, you can use the `openAPISpecs` function at a desired path:

```ts
import { openAPISpecs } from "jsonv-ts/hono";

const app = /* ... your hono app */;
app.get("/openapi.json", openAPISpecs(app, { info: { title: "My API" } }));
```

You may then use Swagger UI to view the API documentation:

```ts
import { swaggerUI } from "@hono/swagger-ui";

const app = /* ... your hono app */;
app.get("/swagger", swaggerUI({ url: "/openapi.json" }));
```

## Validation

The schemas created with `jsonv-ts` are standard JSON Schema objects and can be used with any compliant validator. The library ensures that when the schema object is converted to JSON (e.g., using `JSON.stringify`), only standard JSON Schema properties are included, stripping any internal metadata. For the examples, this is going to be the base schema object.

```ts
const schema = s.object({
   id: s.integer({ minimum: 1 }),
   username: s.string({ minLength: 3 }),
   email: s.string({ format: "email" }).optional(),
});
// { id: number, username: string, email?: string }
```

### Integrated Validator

The library includes an integrated validator that can be used to validate instances against the schema.

```ts
const result = schema.validate({ id: 1, username: "valid_user" });
// { valid: true, errors: [] }
```

**Validation Status**

-  Total tests: 1906
-  Passed: 1412 (74.08%)
-  Skipped: 440 (23.08%)
-  Failed: 0 (0.00%)
-  Optional failed: 54 (2.83%)

Todo:

-  [ ] `$ref` and `$defs`
-  [ ] `unevaluatedItems` and `unevaluatedProperties`
-  [ ] `contentMediaType`, `contentSchema` and `contentEncoding`
-  [ ] meta schemas and `vocabulary`
-  [ ] Additional optional formats: `idn-email`, `idn-hostname`, `iri`, `iri-reference`
-  [ ] Custom formats

### Using `ajv`

```ts
import Ajv from "ajv";
import addFormats from "ajv-formats";

// ... example code from above

const ajv = new Ajv();
addFormats(ajv); // Recommended for formats like 'email'

const validate = ajv.compile(schema.toJSON());

const validUser = { id: 1, username: "valid_user", email: "test@example.com" };
const invalidUser = { id: 0, username: "no" }; // Fails minimum and minLength

console.log(validate(validUser)); // true
console.log(validate(invalidUser)); // false
```

### Using `@cfworker/json-schema`

This validator is designed for environments like Cloudflare Workers and is also standards-compliant.

```ts
import { Validator } from "@cfworker/json-schema";
import * as s from "jsonv-ts";

const validator = new Validator();

// Assume UserSchema is defined as in the common example above

// Validate data directly against the schema
const validUser = { id: 1, username: "valid_user", email: "test@example.com" };
const invalidUser = { id: 0, username: "no" };

const resultValid = validator.validate(validUser, UserSchema.toJSON());
console.log(resultValid.valid); // true
// For errors: console.log(resultValid.errors);

const resultInvalid = validator.validate(invalidUser, schema.toJSON());
console.log(resultInvalid.valid); // false
// For errors: console.log(resultInvalid.errors);
```

### Using `json-schema-library`

```ts
import { compileSchema } from "json-schema-library";

const schema = compileSchema(schema.toJSON());

const validUser = { id: 1, username: "valid_user", email: "test@example.com" };
const invalidUser = { id: 0, username: "no" };

console.log(schema.validate(validUser).valid); // true
console.log(schema.validate(invalidUser).valid); // false
```

## Development

This project uses `bun` for package management and task running.

-  **Install dependencies:** `bun install`
-  **Run tests:** `bun test` (runs both type checks and unit tests)
-  **Run unit tests:** `bun test:unit`
-  **Run JSON Schema test suite:** `bun test:spec`
-  **Run type checks:** `bun test:types`
-  **Build the library:** `bun build` (output goes to the `dist` directory)

## License

MIT

## Acknowledgements

-  [TypeBox](https://github.com/sinclairzx81/typebox) for the inspiration, ideas, and some type inference snippets
-  [@cfworker/json-schema](https://github.com/cfworker/json-schema) for some inspiration
-  [schemasafe](https://github.com/ExodusMovement/schemasafe) for the format keywords
-  [JSON Schema Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite) for the validation tests
-  [hono-openapi](https://github.com/rhinobase/hono-openapi) for the OpenAPI generation inspiration
