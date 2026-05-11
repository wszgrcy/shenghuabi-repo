import { path } from '@cyia/vfs2';
/** 任何路径（posix/windows）转为当地路径 */
export function sysJoin(filePath: string, ...args: string[]) {
  return path.join(filePath, ...args);
}
