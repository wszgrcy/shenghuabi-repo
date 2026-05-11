import { isPlainObject } from 'lodash-es';
import { omitBy } from 'lodash-es';

export function omitDeepBy<T extends object>(
  object: Parameters<typeof omitBy<T>>[0],
  cb: Parameters<typeof omitBy<T>>[1],
): ReturnType<typeof omitBy<T>> {
  function omitByDeepByOnOwnProps(object: any) {
    if (!Array.isArray(object) && !isPlainObject(object)) {
      return object;
    }

    if (Array.isArray(object)) {
      return object.map((element) => omitDeepBy(element, cb));
    }

    const temp = {};

    for (const [key, value] of Object.entries(object)) {
      (temp as any)[key] = omitByDeepByOnOwnProps(value);
    }
    return omitBy(temp, cb);
  }

  return omitByDeepByOnOwnProps(object);
}
