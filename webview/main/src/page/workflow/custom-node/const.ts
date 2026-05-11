import { generateHandle } from '@bridge/share';
/** 分类器使用 */
export const CONNECT_POINT = () => [
  {
    ...generateHandle('[connect]', '[连接点]'),
    type: 'connect' as const,
  },
];
