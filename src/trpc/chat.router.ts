import { observable } from '@trpc/server/observable';
import { t } from './t';
import * as v from 'valibot';

import { ChatMindNode, PromptItem } from '../share';
import { WatchService } from '../service/fs/watch.service';
import { firstValueFrom } from 'rxjs';
import * as vscode from 'vscode';
import { COMMAND } from '@global';
import { ExtensionConfig } from '../service/config.service';
import { ChatService } from '../service/ai/chat.service';
export const ChatRouter = t.router({
  getChatModelConfigNameOptions: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      let list = ctx.injector.get(ChatService).modelList$$();
      return (list ?? []).map((item) => ({
        label: item.name ?? item.model,
        value: item.model,
      }));
    }),
});
