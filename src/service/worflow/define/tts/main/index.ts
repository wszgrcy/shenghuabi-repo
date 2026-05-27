import { NODE_COMMON } from '../common';
import { TEXT_TO_AUDIO_DEFINE } from '../text-to-audio.node.define';
import { TextToAuduioRunner } from './text-to-audio.runner';

export const TTSMainConfig = {
  ...NODE_COMMON,
  runner: TextToAuduioRunner,
  configDefine: TEXT_TO_AUDIO_DEFINE,
} as const;
