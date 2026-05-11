import { ENTRY_HELP_LIST } from '../../../../share/define/knowledge-create/const';
import { NodeComponentType } from '@shenghuabi/workflow/share';

const helpList = [
  `- 使用文章时,需要注意同步文章(状态栏最下方右侧)获取最新数据`,
  `允许使用模板手动指定知识库返回格式`,
  ...ENTRY_HELP_LIST,
];
export const NODE_COMMON: NodeComponentType = {
  icon: { fontIcon: 'school' },
  color: 'accent' as const,
  label: `知识库`,
  type: 'knowledge',
  disableHead: false,
  disableConnect: false,
  help: helpList.join('\n'),

  // config: knowledgeConfig,
};
