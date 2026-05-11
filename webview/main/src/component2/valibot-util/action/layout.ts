import { actions } from '@piying/view-angular-core';

export function asRow<TInput>(count?: number) {
  return actions.wrappers.patch<TInput>([
    {
      type: 'div',
      attributes: {
        class:
          typeof count === 'number'
            ? `grid gap-2 grid-cols-${count}`
            : 'flex gap-2 *:flex-1 items-center',
      },
    },
  ]);
}
export function asColumn<TInput>() {
  return actions.wrappers.patch<TInput>([
    {
      type: 'div',
      attributes: {
        class: 'grid gap-2',
      },
    },
  ]);
}
