import * as v from 'valibot';
import { t } from './t';
import { observable } from '@trpc/server/observable';
import { MindEvent } from '../share';

import { DocumentRequest } from '../webview/custom-editor/type';
import { FlowDocument } from '../service/flow-file/flow-document';
import {
  ConfigManagerService,
  PythonAddonConfigToken,
  TTSPluginSerivce,
  TTSSerivce,
} from '@shenghuabi/python-addon';
import { basename } from 'path';
import { getFileTimestamp } from '@cyia/util';
import { path } from '@cyia/vfs2';
import * as vscode from 'vscode';
import { openFolder } from '../webview/tree/folder.tree';

export const TTSRouter = t.router({
  inited: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const document = (ctx as any)['document'] as FlowDocument;
    document.event.emit(MindEvent.inited);
  }),
  /** 初始化,撤销之类的,需要数据 */
  dataChange: t.procedure.subscription(({ input, ctx }) => {
    const document = (ctx as any)['document'] as FlowDocument;
    return observable<any>((emit) => {
      const updateContent = async (data?: any) => {
        emit.next(data ?? (await document.file.readData()));
      };
      updateContent();
      document.event.on(MindEvent.update, updateContent);
      return () => {
        document.event.off(MindEvent.update, updateContent);
      };
    });
  }),
  /** 保存,另存为之类的,发射信号,被动监听 */
  listenEvent: t.procedure.subscription(({ input, ctx }) => {
    const document = (ctx as any)['document'] as FlowDocument;
    const updateEvent = document.event;
    // 传json直接,但是因为我有压缩算法,所以可以传输时压缩,这样zip里可以保存json了,资源外置
    return observable<DocumentRequest>((emit) => {
      const updateContent = async (value: DocumentRequest) => {
        emit.next(value);
      };
      updateEvent.on(MindEvent.toEditor, updateContent);
      return () => {
        updateEvent.off(MindEvent.toEditor, updateContent);
      };
    });
  }),
  sendEvent: t.procedure
    .input(
      v.object({
        id: v.number(),
        method: v.optional(v.string()),
        data: v.any(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const document = (ctx as any)['document'] as FlowDocument;
      document.event.emit(MindEvent.toEditorResponse, input);
    }),

  textToAuduio: t.procedure.input(v.any()).subscription(({ input, ctx }) => {
    const relPath = basename((ctx as any)['path'].relPath, '.tts');
    const ttsSerivce = ctx.injector.get(TTSSerivce);
    return observable<any>((emit) => {
      ttsSerivce
        .text2speech(
          input,
          `${basename(relPath.replace('/', '_'))}-${getFileTimestamp()}`,
          {
            progress: (item) => {
              emit.next({ type: 0, data: item });
            },
          },
        )
        .then((result) => {
          emit.next({ type: 1, data: result });
          openFolder(ttsSerivce.output$$());
        })
        .catch(emit.error)
        .finally(emit.complete);
    });
  }),
  changeAudioItem: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const ttsSerivce = ctx.injector.get(TTSPluginSerivce);
    const result = await ttsSerivce.changeAudioItem(...(input as [any]));
    return result;
  }),
  resetAudioItem: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const ttsSerivce = ctx.injector.get(TTSPluginSerivce);
    const result = await ttsSerivce.reset(input);
    return result;
  }),
  changeAudioList: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const ttsSerivce = ctx.injector.get(TTSPluginSerivce);
    return Promise.all(
      input.map((item: any) => ttsSerivce.changeAudioItem(item)),
    );
  }),
  resetAudioList: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const ttsSerivce = ctx.injector.get(TTSPluginSerivce);
    return Promise.all(input.map((item: any) => ttsSerivce.reset(item)));
  }),
  getAudioPluginList: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      const ttsSerivce = ctx.injector.get(TTSPluginSerivce);
      return ttsSerivce.getAudioItemPluginList();
    }),
  indexttsEmo: t.router({
    set: t.procedure.input(v.any()).query(async ({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      await instance.setIndexTTSRef(input, input.config);
      if (input.id) {
        await instance.removeIndexTTSRef(input);
      }
    }),
    remove: t.procedure.input(v.string()).query(({ ctx, input }) => {
      const instance = ctx.injector.get(ConfigManagerService);
      instance.removeIndexTTSRef(input);
    }),
  }),
  getAudioAssetPath: t.procedure.input(v.string()).query(({ ctx, input }) => {
    const paConfig = ctx.injector.get(PythonAddonConfigToken);
    return ctx.webview
      .asWebviewUri(vscode.Uri.file(path.resolve(paConfig().dir, input)))
      .toString();
  }),
});
