import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  icon: { fontIcon: 'school' },
  color: 'accent' as const,
  label: `替换选中字符串`,
  type: 'replace-select-string',
  disableHead: false,
  help: `按照要求修改和替换选中的字符串`,
};
