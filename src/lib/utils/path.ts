export const toJsonPointer = (path: (string | number)[] = [], prefix = "") => {
   return (
      "/" +
      [
         prefix,
         ...path.map((p) => {
            return String(p).replace(/\./g, "/");
         }),
      ]
         .filter(Boolean)
         .join("/")
   );
};

export const fromJsonPointer = (pointer: string) => {
   return pointer.split("/").slice(1);
};

export function getJsonPath(
   object: object,
   _path: string | (string | number)[],
   defaultValue = undefined
): any {
   const path =
      typeof _path === "string" ? fromJsonPointer(_path) : toJsonPointer(_path);
   //console.log("getJsonPath", { object, _path, path, defaultValue });
   const result = getPath(object, path, defaultValue);
   //console.log("getJsonPath result", { result });
   return result;
}

export function getPath(
   object: object,
   _path: string | (string | number)[],
   defaultValue = undefined
): any {
   const path =
      typeof _path === "string"
         ? _path.split(/[.\[\]\"]+/).filter((x) => x)
         : _path;

   if (path.length === 0) {
      return object;
   }

   try {
      const [head, ...tail] = path;
      if (!head || !(head in object)) {
         return defaultValue;
      }

      return getPath(object[head], tail, defaultValue);
   } catch (error) {
      if (typeof defaultValue !== "undefined") {
         return defaultValue;
      }

      throw new Error(`Invalid path: ${path.join(".")}`);
   }
}
