import { deepClone } from '../../../share';
import { InjectionToken } from 'static-injector';
const INIT_TEMPLATE = { role: 'user' as const, content: [] };
export function getHumanTemplate() {
  return deepClone(INIT_TEMPLATE);
}
export function getSystemTemplate() {
  return deepClone({ ...INIT_TEMPLATE, role: 'system' });
}
export const WorkspaceDirToken = new InjectionToken<string>(
  'WorkspaceDirToken',
);
