import { deepClone } from '@cyia/util';

const INIT_TEMPLATE = { role: 'user' as const, content: [] };

export function getSystemTemplate() {
  return deepClone({ ...INIT_TEMPLATE, role: 'system' });
}
