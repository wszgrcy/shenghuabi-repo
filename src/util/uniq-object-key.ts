export function getUniqueObjectKey(object: Record<string, any>) {
  return JSON.stringify(object, replacer);
}

const replacer = (key: string, value: any) =>
  value instanceof Object && !Array.isArray(value)
    ? Object.keys(value)
        .sort()
        .reduce(
          (sorted, key) => {
            sorted[key] = value[key];
            return sorted;
          },
          {} as Record<string, any>,
        )
    : value;
