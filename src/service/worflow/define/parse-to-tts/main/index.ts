import { NODE_COMMON } from '../common';
import { Runner } from './runner';

export const ParseToTTSMainConfig = {
  ...NODE_COMMON,
  runner: Runner,
  // define: TEXT_TO_AUDIO_DEFINE,
} as const;
