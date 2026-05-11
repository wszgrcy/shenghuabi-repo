import { pickBy } from 'lodash-es';
/** 从配置中拿真正使用的配置 */
export function getConfigFromOptionConfig(
  data: Record<string, any> | undefined,
  keyList: string[],
) {
  const obj: Record<string, any> = {};
  if (!data) {
    return obj;
  }
  for (const key in data) {
    const item = data[key];
    if (keyList.includes(key)) {
      if (!item.enable) {
        continue;
      }
      (obj as any)[key] = pickBy(
        item.value,
        (item) => item !== undefined && item !== null,
      );
    } else {
      if (item !== undefined && item !== null) {
        (obj as any)[key] = item;
      }
    }
  }
  return obj;
}
