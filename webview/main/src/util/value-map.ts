export function valueMap(start: number, end: number, value = Math.random()) {
  return start + (end - start) * value;
}
