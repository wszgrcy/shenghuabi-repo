export function deepForEach<T>(
  data: T[],
  getItem: (parent: T) => T[] | undefined,
  forEach: (node: T) => void,
) {
  for (const item of data) {
    forEach(item);
    const list = getItem(item);
    if (list) {
      deepForEach(list, getItem, forEach);
    }
  }
  return data;
}
