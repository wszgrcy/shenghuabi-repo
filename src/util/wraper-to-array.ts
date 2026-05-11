export function wrapperToArray<T>(input: T): T extends Array<any> ? T : T[] {
  return (Array.isArray(input) ? input : [input]) as any;
}
