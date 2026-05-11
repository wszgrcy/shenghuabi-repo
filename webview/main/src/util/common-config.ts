import { deepClone } from '@bridge/share';
import { diff } from 'just-diff';
import { set } from 'lodash-es';

/** 处理相同数据
 * 只处理节点中的data,其他不管
 */
export function commonConfig(list: any[]) {
  if (list.length === 1) {
    return list[0];
  }
  /** 以第一个为模板,进行修改 */
  const current = deepClone(list[0]);
  for (let index = 1; index < list.length; index++) {
    const item = list[index];
    if (!item) {
      return undefined;
    }
    diff(current, item).forEach(({ op, path }) => {
      const index = path.findIndex((item) => typeof item === 'number');
      if (index === -1) {
        if (op === 'add') {
          return;
        }
        set(current, path, null);
      } else {
        set(current, path.slice(0, index), null);
      }
    });
  }

  return current;
}
