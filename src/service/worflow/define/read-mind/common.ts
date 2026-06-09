import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  icon: { fontIcon: 'school' },
  color: 'accent' as const,
  label: `读取脑图`,
  type: 'read-mind',
  disableHead: false,
  help: `读取当前工作区内的脑图文件(.nt/.naotu)`,
};
