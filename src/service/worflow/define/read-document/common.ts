import { NodeComponentType } from '@shenghuabi/workflow/share';

export const NODE_COMMON: NodeComponentType = {
  icon: { fontIcon: 'school' },
  color: 'accent' as const,
  label: `读取文档`,
  type: 'read-document',
  disableHead: false,
  help: `读取任意非文本文档;支持.srt, .pptx, .odt, .odp, .ods, .pdf, .csv, .docx, .xlsx, .epub, .nt , .naotu的读取`,
};
