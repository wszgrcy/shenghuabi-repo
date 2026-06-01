import { NODE_COMMON } from '../common';
import { PARSE_TO_TTS_DEFINE } from '../node.define';
import { Runner } from './runner';

export const ParseToTTSMainConfig = {
  ...NODE_COMMON,
  runner: Runner,
  configDefine: PARSE_TO_TTS_DEFINE,
} as const;
