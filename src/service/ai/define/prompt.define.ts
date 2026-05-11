import * as v from 'valibot';
import { ChatMessageListDefine } from '@shenghuabi/openai';
const CommonDefine = v.object({
  title: v.string(),
});
export const ContextTemplateDefine = v.object({
  ...CommonDefine.entries,
  mode: v.optional(v.literal('template'), 'template'),
  template: ChatMessageListDefine,
});
export const WorkflowTemplateDefine = v.object({
  ...CommonDefine.entries,
  mode: v.optional(v.literal('workflow'), 'workflow'),
  workflow: v.object({
    path: v.string(),
  }),
});
