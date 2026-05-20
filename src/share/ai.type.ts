import { ChatMessageListInputType } from '@shenghuabi/openai/define';
import { ChatHistoryListType } from './chat/define/history';
import { CustomNode } from './workflow';
/** 对话知识来源 */
export enum ChatContextType {
  article = '文章',
  file = '文件',
  knowledge = '知识库',
  dict = '字典',
  image = '图片',
  card = '卡片',
}

export * from '../service/ai/prompt.type';

export type CommonChat = ChatHistoryListType[number];

export type PromptTemplateChatOption = ChatOptions & { title: string };

export enum ChatMode {
  workflow = 'workflow',
  template = 'template',
  default = 'default',
}

export interface WorkflowChatOptions {
  mode: ChatMode.workflow;
  input?: Record<string, any>;
  /** todo 不确定是否保留 */
  context?: Record<string, CustomNode>;
  workflow?: {
    path: string;
  };
}
export interface ChatOptions {
  mode: ChatMode;
  input?: Record<string, any>;
  template?: ChatMessageListInputType;
  /** todo 不确定是否保留 */
  context?: Record<string, CustomNode>;
  workflow?: {
    path: string;
  };
  modelConfigName?: string;
}
