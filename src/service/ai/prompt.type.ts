import { PromptTemplateChatOption } from '../../share';

// todo 类型名字之类的？
/** 准备保存的模板项 */
export type PromptItem = Omit<PromptTemplateChatOption, 'input'>;
export type PromptInput = Record<string, any>;
