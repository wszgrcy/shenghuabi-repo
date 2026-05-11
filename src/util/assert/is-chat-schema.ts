import { isObject, isString } from 'lodash-es';
export function isChatSchema(input: any) {
  return (
    input &&
    typeof input === 'object' &&
    isString(input.name) &&
    isObject(input.schema)
  );
}
