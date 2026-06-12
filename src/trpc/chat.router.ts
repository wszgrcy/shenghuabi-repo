import { t } from './t';
import * as v from 'valibot';

import { ChatService } from '../service/ai/chat.service';
export const ChatRouter = t.router({
  getChatModelConfigNameOptions: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      const list = ctx.injector.get(ChatService).modelList$$();
      return (list ?? []).map((item) => ({
        label: item.name ?? item.model,
        value: item.model,
      }));
    }),
});
