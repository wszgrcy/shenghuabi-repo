import * as v from 'valibot';
import { ChatMode } from '../../../ai.type';
import { ChatMessageListDefine } from '@shenghuabi/openai/define';

const CHAT_STRING_ITEM = v.string();
const ChatMessageContentText = v.object({
  type: v.literal('text'),
  text: v.string(),
});
const ChatMessageImageUrl = v.object({
  type: v.literal('image_url'),
  image_url: v.string(),
});
const CHAT_OBJ_ITEM = v.tupleWithRest(
  [ChatMessageContentText],
  ChatMessageImageUrl,
);

export const CHAT_ITEM = v.union([CHAT_STRING_ITEM, CHAT_OBJ_ITEM]);

export type CHAT_ITEM_TYPE = v.InferOutput<typeof CHAT_ITEM>;

export const ContextChatTemplate = ChatMessageListDefine;
export const ChatModeDefine = v.enum(ChatMode);
