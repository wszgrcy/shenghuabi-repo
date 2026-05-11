import diff from 'fast-diff';
export interface DiffChangeItem {
  oldValue: string;
  newValue: string;
}

export function textDiffEdit(oldChange: string, newChange: string) {
  let start = 0;
  const result = diff(oldChange, newChange);
  const changeMap = new Map<number, DiffChangeItem>();
  let lastItem: diff.Diff | undefined;
  for (const item of result) {
    if (item[0] === 0) {
      start += item[1].length;
    } else if (item[0] === 1) {
      if (lastItem && lastItem[0] == -1) {
        const index = start - lastItem[1].length;
        if (changeMap.has(index)) {
          const data = changeMap.get(index)!;
          data.newValue = item[1];
        }
      } else {
        changeMap.set(start, { oldValue: '', newValue: item[1] });
      }
    } else if (item[0] === -1) {
      changeMap.set(start, { oldValue: item[1], newValue: '' });
      start += item[1].length;
    }
    lastItem = item;
  }
  return changeMap;
}
