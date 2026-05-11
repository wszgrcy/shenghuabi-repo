import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  icon: { fontIcon: 'wysiwyg' },
  type: 'mindCard',
  color: 'accent' as const,
  label: `脑图卡片` as const,
  help: `- 选择脑图中的卡片`,

  disableHead: false,
  disableConnect: false,
  // (injector) => MindCardNodeConfig.form(injector),
};
