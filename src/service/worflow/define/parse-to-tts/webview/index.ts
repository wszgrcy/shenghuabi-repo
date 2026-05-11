import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { PARSE_TO_TTS_DEFINE } from '../node.define';

export const ParseToTTSWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: PARSE_TO_TTS_DEFINE,
  // config: TEXT_TO_AUDIO_DEFINE,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },
      },
      width: 300,
    };
  },
};
