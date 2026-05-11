import rfdc from 'rfdc';
const clone = rfdc();
export function deepClone<T>(data: T): T {
  return clone(data);
}
