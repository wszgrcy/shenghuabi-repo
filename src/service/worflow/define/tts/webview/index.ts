import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { NODE_COMMON } from '../common';
import { TEXT_TO_AUDIO_DEFINE } from '../text-to-audio.node.define';

export const TTSWebviewConfig: WebviewNodeConfig = {
  ...NODE_COMMON,
  displayConfig: TEXT_TO_AUDIO_DEFINE,
  config: TEXT_TO_AUDIO_DEFINE,
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
