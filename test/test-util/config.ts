import { writeFile } from 'fs/promises';
import { getWorkSpaceDir } from './test-path';
import { path } from '@cyia/vfs2';

let dir = getWorkSpaceDir();
export function writeConfig(config: Record<string, any>) {
  return writeFile(
    path.join(dir, '.vscode', 'settings.json'),
    JSON.stringify(config, undefined, 4),
  );
}
