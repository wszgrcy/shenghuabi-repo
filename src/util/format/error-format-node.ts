import { inspect } from 'util';
export function errorFormatByNode(input: any) {
  if (input instanceof Error) {
    return inspect(input);
  } else if (input && typeof input === 'object') {
    return JSON.stringify(input);
  } else {
    return `${input}`;
  }
}
