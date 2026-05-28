import { NodeComponentType } from '@shenghuabi/workflow/share';

const helpList = [
  `查询知识库,并返回文本片段`,
  // ...ENTRY_HELP_LIST,
];
export const NODE_COMMON: NodeComponentType = {
  icon: { fontIcon: 'school' },
  color: 'accent' as const,
  label: `知识库`,
  type: 'knowledge',
  disableHead: false,
  help: helpList.join('\n'),

  // config: knowledgeConfig,
};
