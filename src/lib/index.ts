export {
   type TSchema,
   type TOptional,
   type TAnySchema,
   schema,
   any,
} from "./schema";
export type { Static, StaticConstEnum, StaticCoersed } from "./static";
export {
   object,
   type ObjectSchema,
   type TObject,
   record,
   partialObject,
   type TPartialObject,
   strictObject,
} from "./object/object";
export { string, stringConst } from "./string/string";
export {
   number,
   type TNumber,
   type NumberSchema,
   integer,
} from "./number/number";
export { array } from "./array/array";
export { boolean } from "./boolean/boolean";
export { anyOf, oneOf } from "./union/union";
export { fromSchema } from "./schema/from-schema";
export { ref, type TRef, refId, type TRefId } from "./ref/ref";
export type {
   ValidationResult,
   ValidationOptions,
} from "./validation/validate";
export { error, type ErrorDetail, valid, makeOpts } from "./utils/details";
