export function isIterable(obj: any): obj is Generator {
  return typeof obj?.[Symbol.iterator] === 'function';
}
