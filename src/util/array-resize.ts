export function arrayResize<T>(list: T[], ...args: number[]): any {
  let preList = list;
  let nextList = [] as any;
  while (args.length) {
    const step = args.shift()!;
    for (let i = 0; i < preList.length; i += step) {
      nextList.push(preList.slice(i, i + step));
    }
    preList = nextList;
    nextList = [];
  }

  return preList;
}
