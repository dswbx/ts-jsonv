import {
   schema,
   type TAnySchema,
   type TCustomSchema,
   type TCustomType,
   type TSchemaBase,
} from "./schema.ts";

export type TAny<O extends TSchemaBase = TSchemaBase> = TCustomSchema<
   O,
   any
> & {
   static: any;
};

export const any = <O extends TSchemaBase>(options: O = {} as O): TAny<O> => {
   return schema(options as any, "any") as any;
};

type Primitive = string | number | boolean | null | undefined | bigint;

type LiteralType<T, Excluded extends object> = T extends Primitive
   ? T
   : T extends object
   ? T extends Excluded
      ? never
      : T
   : never;

export type TLiteral<
   ConstValue,
   O extends TCustomType,
   Out = ConstValue extends TAnySchema ? never : ConstValue
> = TCustomSchema<{ const: Out } & O, unknown> & {
   static: Out;
};

export const literal = <const L, const O extends Omit<TCustomType, "const">>(
   value: LiteralType<L, TAnySchema>,
   options: O = {} as O
): TLiteral<L, O> => {
   return schema({ const: value, ...options }, "literal") as any;
};
