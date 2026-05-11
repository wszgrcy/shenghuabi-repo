import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  type: 'parseToTTS',
  label: `文本解析TTS配置`,
  icon: { fontIcon: 'audiotrack' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [`- 文本解析TTS配置`].join('\n'),
  // config: defineConfig,

  inputs: [],
  outputs: [],
};
