export function isIterable(obj: any): obj is Generator {
  return typeof obj?.[Symbol.iterator] === 'function';
}
export function isAsyncIterable(obj: any): obj is AsyncGenerator {
  return typeof obj?.[Symbol.asyncIterator] === 'function';
}
