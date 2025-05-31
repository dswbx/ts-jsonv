import { schema, type TCustomSchema, type TSchema } from "../schema";
import { isNumber } from "../utils";

export interface StringSchema extends Partial<TSchema> {
   maxLength?: number;
   minLength?: number;
   pattern?: string;
   format?: string;
}

export type TString<O extends StringSchema> = TCustomSchema<O, string>;

export const string = <const S extends StringSchema = StringSchema>(
   config: S = {} as S
): TString<S> =>
   schema(
      {
         template: () => "",
         coerce: (value: unknown) => {
            // only coerce numbers to strings
            if (isNumber(value)) return String(value);
            return value;
         },
         ...config,
         type: "string",
      },
      "string"
   ) as any;
