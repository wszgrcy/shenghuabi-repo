import * as v from 'valibot';

import {
  MindHandleDefine,
  NodeCommonDefine,
  RectSize,
  TitleDefine,
  transform,
} from './common/node-data';
import { ChatModeDefine, ContextChatTemplate } from './common/chat';
import { CardEditorDefine } from './card';
import { ChatMode } from '../../ai.type';
import { ChatHistoryList } from '../../chat/define/history';
export const ChatValueDefine = v.object({
  firstItem: v.object({
    input: v.optional(v.custom<Record<string, any>>(Boolean), {}),
    /** @deprecated 为啥没了?是否可以去掉  */
    context: v.optional(v.array(v.any()), []),
    template: v.optional(ContextChatTemplate, [
      { role: 'system', content: [{ type: 'text', text: '' }] },
      { role: 'user', content: [{ type: 'text', text: '' }] },
    ]),
    mode: v.optional(ChatModeDefine, ChatMode.template),
  }),
  list: v.pipe(v.optional(ChatHistoryList, [])),
  // 保存什么?
  chatResult: v.optional(v.any()),
});
// 默认值

export const ChatDefaultDefine = v.object({
  editor: CardEditorDefine,
  minSize: v.optional(RectSize, { width: 350, height: 400 }),
  transform,
});

export const ChatDataDefine = v.object({
  ...NodeCommonDefine.entries,
  ...ChatDefaultDefine.entries,
  handle: v.optional(MindHandleDefine),
  title: TitleDefine,
  value: ChatValueDefine,
});

export type ChatDataType = v.InferOutput<typeof ChatDataDefine>;
