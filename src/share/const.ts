export enum WebviewPage {
  main = 'main',
  richEditor = 'richEditor',
  mind = 'mind',
  ttsEditor = 'ttsEditor',
  workflow = 'workflow',
  aiChat = 'aiChat',
  knowledgeCreate = 'knowledgeCreate',
  environmentConfiguration = 'configuration',
  markdown = 'markdown',
  dictImport = 'dictImport',
  knowledgeQuery = 'knowledgeQuery',
  idAsset = 'idAsset',
  quickPick = 'quickPick',
  knowledgeGraph = 'knowledgeGraph',
  chatPromptEdit = 'chatPromptEdit',
  knowledgeConfigEdit = 'knowledgeConfigEdit',
  TTSLineEdit = 'TTSLineEdit',
  pluginConfig = 'pluginConfig',
}
/** 工作流默认输入 */
export const DEFAULT_INPUT_LABEL = `[输入]`;
export const UUID_NS = '404cfae8-94e7-41a6-acec-1037dd1fdaad' as const;
export const WORKFLOW_VERSION = 7;
// jpeg, png, webp, gif, svg 只支持这几种解码
/** 对话支持的图片格式列表 */
