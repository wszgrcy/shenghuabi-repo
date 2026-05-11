import { effect, Injector, untracked } from '@angular/core';

export function effectOnce<T, D>(
  filter: () => Promise<T> | T,
  callback: (input: NonNullable<T>) => D,
  injector?: Injector,
) {
  return new Promise<D>((resolve) => {
    const ref = effect(
      async () => {
        const result = await Promise.resolve(filter());
        return untracked(() => {
          if (result) {
            setTimeout(() => {
              ref.destroy();
            }, 0);
            resolve(callback(result));
          }
        });
      },
      { injector: injector },
    );
  });
}
