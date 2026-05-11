import { NODE_COMMON } from '../common';
import { SerializeRunner } from './serialize.runner';

export const SerializeMainConfig = {
  ...NODE_COMMON,
  runner: SerializeRunner,
} as const;
