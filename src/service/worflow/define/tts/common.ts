import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'tts',
  label: `文本转语音`,
  icon: { fontIcon: 'audiotrack' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [`- 文本转语音`].join('\n'),
  // config: defineConfig,

  inputs: [],
  outputs: [],
};
