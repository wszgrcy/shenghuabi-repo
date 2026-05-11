const Complete = Symbol('Complete');
// 注意此方法只能用于异步,如果是同步的话就会丢失
// 增加buffer
export function createAsyncGeneratorAdapter<T>() {
  let promise$ = Promise.withResolvers<void>();
  let value$$ = promise$.promise;
  const list: (T | typeof Complete)[] = [];
  return {
    next: (value: T) => {
      list.push(value);
      promise$.resolve();
      promise$ = Promise.withResolvers<void>();
    },
    complete: () => {
      list.push(Complete);
      promise$.resolve();
    },
    getData: async function* () {
      do {
        await value$$;
        value$$ = promise$.promise;
        while (list.length) {
          const item = list.shift()!;
          if (item === Complete) {
            return;
          } else {
            yield item;
          }
        }
      } while (true);
    },
  };
}
