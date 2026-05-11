export function formToDataset(value: Record<string, any>) {
  return Object.entries(value).reduce(
    (object, item) => {
      object[`data-${item[0]}`] = item[1] as string;
      return object;
    },
    {} as Record<string, string>,
  );
}
