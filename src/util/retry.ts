export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    count: number;
    delay?: number;
    errorFn?: (error: any) => any;
  },
): Promise<T> {
  for (let index = 0; index < options.count; index++) {
    try {
      return await fn();
    } catch (error) {
      await options.errorFn?.(error);
      if (options.delay) {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, options.delay);
        });
      }
    }
  }
  throw new Error(`重试${options.count}次后失败`);
}
