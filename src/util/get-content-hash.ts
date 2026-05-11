import { createHash } from 'crypto';

export function getHash(content: string) {
  const id = createHash('md5');
  return id.update(content).digest('hex');
}
