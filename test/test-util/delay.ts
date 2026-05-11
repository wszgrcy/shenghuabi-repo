export function delay(value: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(undefined);
    }, value);
  });
}
