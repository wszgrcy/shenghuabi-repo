import * as v from 'valibot';
import { t } from './t';
import { FolderName, WorkspaceService } from '../service/workspace.service';

import { MindService } from '../service/mind/mind.service';
import { observable } from '@trpc/server/observable';
import { path } from '@cyia/vfs2';
import * as vscode from 'vscode';
import { openFolder } from '../webview/tree/folder.tree';
import { v4 } from 'uuid';
import { DocumentRequest } from '../webview/custom-editor/type';
import { MindEvent } from '../share';
import { FlowDocument } from '../service/flow-file/flow-document';
import { effect } from 'static-injector';
import { LogFactoryService } from '../service/log.service';

export const MindRouter = t.router({
  nodeTemplate: t.router({
    getAll: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
      const service = ctx.injector.get(MindService);
      return service.getAllNodeTemplateData();
    }),
    getOne: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
      const service = ctx.injector.get(MindService);
      return service.getAllNodeTemplateData().then((obj) => obj[input]);
    }),
    getAll$: t.procedure.input(v.any()).subscription(async ({ input, ctx }) => {
      const service = ctx.injector.get(MindService);
      const a = observable<Record<string, any>>((ob) => {
        const ref = effect(
          () => {
            service.updateIndex();
            service.getAllNodeTemplateData().then((value) => {
              ob.next(value);
            });
          },
          { injector: ctx.injector },
        );
        return () => {
          ref.destroy();
        };
      });

      return a;
    }),
    saveItem: t.procedure
      .input(
        v.object({
          name: v.string(),
          data: v.record(v.string(), v.any()),
        }),
      )
      .query(async ({ input, ctx }) => {
        const service = ctx.injector.get(MindService);
        return service.saveNodeTemplateItem(input);
      }),
    deleteItem: t.procedure
      .input(
        v.object({
          name: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const service = ctx.injector.get(WorkspaceService);
        const dir = service.dir[FolderName.mindDir]();
        const filePath = path.join(dir, 'node-template.json');
        const data = JSON.parse(
          (await service.rootVfs.readContent(filePath)) || '{}',
        );
        delete data[input.name];
        await service.rootVfs.write(filePath, JSON.stringify(data));
        return data;
      }),
  }),
  nodeTheme: t.router({
    getAll: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
      const service = ctx.injector.get(MindService);
      return service.getAllNodeThemeList();
    }),
    getOne: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
      const service = ctx.injector.get(MindService);
      return service.getNodeThemeItem(input);
    }),
  }),
  /** 脑图中编辑器关联新文件 */
  openArticle: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    const workspace = ctx.injector.get(WorkspaceService);
    const logger = ctx.injector.get(LogFactoryService).getLog('system');
    if (!workspace.nFolder()) {
      logger.warn('无工作区,无法打开');
      return;
    }
    const aFilePath = path.join(workspace.nFolder(), input);
    if (!(await workspace.vfs.exists(aFilePath))) {
      await workspace.vfs.writeFile(aFilePath, '');
    }
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(aFilePath));
  }),
  openThemeDir: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const mind = ctx.injector.get(MindService);
    const dir = await mind.themeDir();
    openFolder(dir);
  }),
  // todo 二合一
  saveImage: t.procedure
    .input(
      v.object({
        name: v.string(),
        buffer: v.custom<Uint8Array>(Boolean),
      }),
    )
    .query(async ({ input, ctx }) => {
      const document = (ctx as any)['document'] as FlowDocument;
      await document.file.writeTempImage(input.name, input.buffer);
    }),
  saveImageLocal: t.procedure
    .input(
      v.object({
        imgPath: v.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const document = (ctx as any)['document'] as FlowDocument;
      const vfs = ctx.injector.get(WorkspaceService).rootVfs;
      const fileName = `${v4()}${path.basename(input.imgPath)}`;
      const buffer = new Uint8Array(await vfs.readFile(input.imgPath));

      await document.file.writeTempImage(fileName, buffer);
      return fileName;
    }),
  inited: t.procedure
    .input(v.optional(v.any()))
    .query(async ({ input, ctx }) => {
      const document = (ctx as any)['document'] as FlowDocument;
      document.event.emit(MindEvent.inited);
    }),
  /** 初始化,撤销之类的,需要数据 */
  dataChange: t.procedure.subscription(({ input, ctx }) => {
    const document = (ctx as any)['document'] as FlowDocument;
    const updateEvent = document.event;
    return observable<any>((emit) => {
      const updateContent = async (data?: any) => {
        emit.next(data ?? (await document.file.readData()));
      };
      updateContent();
      updateEvent.on(MindEvent.update, updateContent);

      return () => {
        updateEvent.off(MindEvent.update, updateContent);
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
});

// images/xxx.png?query
