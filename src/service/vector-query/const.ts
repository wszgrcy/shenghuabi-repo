export const separators = [
  '\n\n',
  '\n',
  '……',
  '。」',
  '！」',
  '？」',
  '。”',
  '！”',
  '？”',
  '。',
  '！',
  '？',
  ' ',
  '',
];

export function minChunkOverlap(size: number, value = 20) {
  const currentSize = Math.max(size * 0.2, value) | 0;
  return currentSize >= size ? 0 : currentSize;
}
