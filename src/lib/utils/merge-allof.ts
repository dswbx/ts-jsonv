export interface MergeOptions {
   /** Recursively merge nested allOfs? (default true) */
   deep?: boolean;
   /** Custom per‑keyword merge resolvers */
   resolvers?: Partial<Record<string, Resolver>>;
}

export type Resolver = (
   fragments: unknown[],
   key: string,
   merge: (a: unknown, b: unknown) => unknown
) => unknown;

// -----------------------------------------------
// helpers

const isObject = (v: unknown): v is Record<string, unknown> =>
   typeof v === "object" && v !== null && !Array.isArray(v);

const clone = <T>(value: T): T =>
   typeof (globalThis as any).structuredClone === "function"
      ? (globalThis as any).structuredClone(value)
      : JSON.parse(JSON.stringify(value));

const numericMaxKeys = [
   "maximum",
   "exclusiveMaximum",
   "maxLength",
   "maxItems",
   "maxProperties",
] as const;

const numericMinKeys = [
   "minimum",
   "exclusiveMinimum",
   "minLength",
   "minItems",
   "minProperties",
] as const;

// -----------------------------------------------
// default resolvers – 90 % case

function defaultResolvers(): Record<string, Resolver> {
   const r: Record<string, Resolver> = {
      /* intersect primitive/array `type`s */
      type(values) {
         const sets = values.map((v) =>
            Array.isArray(v) ? new Set(v) : new Set([v])
         );
         // @ts-expect-error
         const common = sets.reduce<Set<any>>((acc, s) =>
            acc ? new Set([...acc].filter((x) => s.has(x))) : new Set(s)
         );
         if (!common.size) throw new Error('Incompatible "type" in allOf');
         return common.size === 1 ? [...common][0] : [...common];
      },

      /* intersect `enum`s */
      enum(values) {
         const common = (values as any[])
            .map((v) => new Set(v))
            .reduce((acc, s) => new Set([...acc].filter((x) => s.has(x))));
         if (!common.size) throw new Error('Incompatible "enum" in allOf');
         return [...common];
      },

      /* union of required */
      required(values) {
         return [...new Set(values.flat())];
      },

      /* merge property‑maps */
      properties(values, _k, merge) {
         return values.reduce((acc, v) => merge(acc, v) as any, {});
      },
      patternProperties(values, _k, merge) {
         return values.reduce((acc, v) => merge(acc, v) as any, {});
      },
      $defs(values, _k, merge) {
         return values.reduce((acc, v) => merge(acc, v) as any, {});
      },
      definitions(values, _k, merge) {
         return values.reduce((acc, v) => merge(acc, v) as any, {});
      },

      // numeric limits – stricter wins
      ...Object.fromEntries(
         numericMaxKeys.map<[string, Resolver]>((k) => [
            k,
            // @ts-expect-error
            (vals: number[]) => Math.min(...vals),
         ])
      ),
      ...Object.fromEntries(
         numericMinKeys.map<[string, Resolver]>((k) => [
            k,
            // @ts-expect-error
            (vals: number[]) => Math.max(...vals),
         ])
      ),
   };
   return r;
}

// -----------------------------------------------
// merging core

function buildMerger(opts: MergeOptions) {
   const resolvers = { ...defaultResolvers(), ...opts.resolvers } as Record<
      string,
      Resolver
   >;

   function merge(a: unknown, b: unknown): unknown {
      /* arrays → unique concatenation */
      if (Array.isArray(a) && Array.isArray(b))
         return [...new Set([...a, ...b])];

      /* objects → deep field‑wise merge */
      if (isObject(a) && isObject(b)) {
         const out: Record<string, unknown> = { ...a };
         for (const [k, v] of Object.entries(b)) {
            if (k in out) {
               const resolver = resolvers[k];
               out[k] = resolver ? resolver([out[k], v], k, merge) : clone(v);
            } else {
               out[k] = clone(v);
            }
         }
         return out;
      }

      /* any other combination → last one wins (clone b) */
      return clone(b);
   }

   return merge;
}

// truth table helpers for boolean schemas in allOf
const asBool = (x: unknown): null | boolean =>
   x === true || x === false ? (x as boolean) : null;

// -----------------------------------------------
// main – mergeAllOf

export function mergeAllOf<T = any>(schema: T, opts: MergeOptions = {}): T {
   const deep = opts.deep !== false;
   const merge = buildMerger(opts);

   function walk(node: unknown): unknown {
      if (Array.isArray(node)) return node.map(walk);
      if (!isObject(node)) return node;

      if (Array.isArray(node.allOf)) {
         const parts = node.allOf.map(walk);

         // ---------- boolean short‑cuts ----------
         if (parts.some((p) => p === false)) return false; // anything AND false → false
         const filtered = parts.filter((p) => p !== true); // drop identity‑true
         if (!filtered.length) return true; // all were true → true

         // ---------- merge remaining fragments ----------
         const merged = filtered.reduce((acc, s) => merge(acc, s) as any, {});

         // If merged collapses to a pure boolean, honour it and stop here.
         const mb = asBool(merged);
         if (mb !== null) return mb;

         // Combine with the rest of the current node (excluding allOf)
         const rest: Record<string, unknown> = { ...node };
         delete rest.allOf;

         const result = merge(merged, deep ? walk(rest) : rest);
         return deep ? walk(result) : result;
      }

      // traverse object children
      const copy: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node)) copy[k] = walk(v);
      return copy;
   }

   return walk(schema) as T;
}
