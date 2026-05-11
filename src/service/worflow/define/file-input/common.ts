import { NodeComponentType } from '@shenghuabi/workflow/share';
import { HelpObj } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  icon: { fontIcon: 'attach_file' },
  color: 'accent' as const,
  label: `文件输入`,
  disableHead: false,
  disableConnect: false,
  type: 'file',
  help: [
    `- 所有输入文件都会被尝试转换为文本`,
    '> 比如`docx`转换为文本',
    `- 图片类型文件会进行OCR`,
    `- 如果想读取图片请使用\`图片输入\``,
    `${HelpObj.pathTodoLine}`,
  ].join('\n'),

  outputs: [
    [
      { value: 'first', label: '第一项' },
      { value: 'flat', label: '扁平数组' },
    ],
  ],
  // (injector) => FileNodeConfig.form(injector),
};
