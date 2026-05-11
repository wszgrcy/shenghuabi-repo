import { Signal, effect } from '@angular/core';
import { CustomNode } from './type';

export function ifUpdate(
  prop: Signal<CustomNode>,
  fn: (value: CustomNode['data']) => void,
  cb: (value: any) => void,
) {
  let lastValue: any;
  effect(() => {
    const a = prop().data;
    const newValue = fn(a);
    if (newValue !== lastValue) {
      lastValue = newValue;
      cb(newValue);
    }
  });
}
