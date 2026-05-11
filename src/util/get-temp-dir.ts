import { path } from '@cyia/vfs2';
import { tmpdir } from 'node:os';
import { v4 } from 'uuid';
import fs from 'fs';
export function getTempDir() {
  return path.join(tmpdir(), v4());
}

export async function createTempDir() {
  const dir = getTempDir();
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}
