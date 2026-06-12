import { observable } from '@trpc/server/observable';
import { t } from './t';
import * as v from 'valibot';

import { ChatMindNode, PromptItem } from '../share';
import { WatchService } from '../service/fs/watch.service';
import { firstValueFrom } from 'rxjs';
import * as vscode from 'vscode';
import { COMMAND } from '@global';
import { ExtensionConfig } from '../service/config.service';
export const ChatRouter = t.router({


 


  getChatModelConfigName: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      const list = ExtensionConfig.chatModelList();
      if (!list) {
        return;
      }
      const result = await vscode.window.showQuickPick(
        list.map((item) => ({ label: item.name, value: item.name })),
      );

      return result?.value;
    }),
  getChatModelConfigNameOptions: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      const list = ExtensionConfig.chatModelList();
      return (list ?? []).map((item) => ({
        label: item.name,
        value: item.name,
      }));
    }),
});
