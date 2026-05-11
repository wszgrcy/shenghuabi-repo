export function deepFilterBoolean<T extends Record<string, any>>(
  obj: T,
): T | undefined {
  if (!obj) {
    return undefined;
  }
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value && typeof value === 'object') {
        return [key, deepFilterBoolean(value)] as const;
      } else {
        return [key, value] as const;
      }
    })
    .reduce((obj, [key, value]) => {
      if (value !== null && value !== undefined) {
        (obj as any)[key] = value;
      }
      return obj;
    }, {} as T);
}
