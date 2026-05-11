import {
  DEFAULT_CHAT_SCHEMA_KEY,
  NodeComponentType,
  RUNNER_ORIGIN_OUTPUT_KEY,
} from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  priority: -99,
  type: 'chat-vl',
  label: `图片视觉`,
  icon: { fontIcon: 'chat' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [].join('\n'),
  // config: defineConfig,
  inputs: [
    [],
    [
      {
        label: 'JsonSchema',
        value: DEFAULT_CHAT_SCHEMA_KEY,
        inputType: 'schema',
        optional: true,
      },
    ],
  ],
  outputs: [[{ label: '原始输出', value: RUNNER_ORIGIN_OUTPUT_KEY }]],
};
