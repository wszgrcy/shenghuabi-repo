import { han2numberReChange } from '@shenghuabi/han2number';

export function getNumberText(name: string) {
  let useNumber = false;
  return han2numberReChange(name, (a) => {
    if (!useNumber && typeof a === 'number') {
      useNumber = true;
      return `${a}`;
    }
    return useNumber ? '' : `${a}`;
  });
}
