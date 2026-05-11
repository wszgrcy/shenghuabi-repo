import * as v from 'valibot';
import { t } from './t';
import { WorkspaceService } from '../service/workspace.service';

import * as vscode from 'vscode';
import { homedir } from 'node:os';

import { MIND_EXT_LIST } from '../const';
import { selectFile } from '../util/platform/select-file';
import { openFolder } from '../webview/tree/folder.tree';
import { bufferDecodeToText } from '@shenghuabi/knowledge/file-parser';
import { observable } from '@trpc/server/observable';
import { createMessage2Log } from '@cyia/dl';
import { path } from '@cyia/vfs2';
import { LogService } from '@cyia/external-call';
import { DownloadService } from '../service/download.service';

interface FileTreeItem {
  key: string;
  title: string;
  path: string;
  fullPath: string;
  children?: FileTreeItem[];
}
export const FsRouter = t.router({
  findAll: t.procedure
    .input(v.object({ flat: v.optional(v.boolean(), false) }))
    .query(async ({ input, ctx }) => {
      const list: { key: string; title: string }[] = [];
      const fs = ctx.injector.get(WorkspaceService);
      const data = await fs.listAllTree<FileTreeItem>(
        '',
        (path, fullPath) => {
          return (
            !path.endsWith(MIND_EXT_LIST[0]) &&
            !path.endsWith(MIND_EXT_LIST[1]) &&
            !fullPath.startsWith('.')
          );
        },
        async (path, fullPath, children) => {
          const item = { key: fullPath, title: path, path, fullPath, children };
          if (input.flat) {
            list.push(item);
          }
          return item;
        },
      );
      return input.flat ? list : data;
    }),
  openFolder: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    openFolder(input);
  }),
  openWorkspaceFolder: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      const workspace = ctx.injector.get(WorkspaceService);
      openFolder(path.resolve(workspace.nFolder(), input));
    }),

  selectFolder: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    return vscode.window
      .showOpenDialog({
        defaultUri: vscode.Uri.file(input || homedir()),
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: `请选择文件夹`,
      })
      .then((list) => {
        return list?.[0].fsPath;
      });
  }),
  selectFiles: t.procedure
    .input(
      v.object({
        title: v.string(),
        multi: v.boolean(),
        filters: v.optional(
          v.custom<{
            [name: string]: string[];
          }>(Boolean),
        ),
      }),
    )
    .query(async ({ input, ctx }) => {
      return selectFile(input.title, input.multi, input.filters).then(
        (list) => {
          if (input.multi) {
            return (list as vscode.Uri[] | undefined)?.map(
              (item) => item.fsPath,
            );
          }
          return (list as vscode.Uri | undefined)?.fsPath;
        },
      );
    }),
  selectFileByVSCode: t.procedure
    .input(v.object({ filterType: v.string() }))
    .query(async ({ input, ctx }) => {
      let filterFn;
      if (input.filterType === 'article') {
        filterFn = (path: string, fullPath: string) => {
          //todo 去掉图片.文档类型
          return (
            !path.endsWith(MIND_EXT_LIST[0]) &&
            !path.endsWith(MIND_EXT_LIST[1]) &&
            !fullPath.startsWith('.')
          );
        };
      }
      const fs = ctx.injector.get(WorkspaceService);
      const data = await fs.listAllTree2<string>(
        '',
        filterFn!,
        (path, fullPath, children) => {
          return fullPath;
        },
      );
      const result = await vscode.window.showQuickPick(data, {
        title: '请选择一个文件',
        canPickMany: false,
      });
      return result;
    }),
  readFileContent: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      return bufferDecodeToText(
        await vscode.workspace.fs.readFile(vscode.Uri.file(input)),
      );
    }),
  download: t.procedure
    .input(
      v.object({
        fileList: v.array(
          v.object({
            url: v.string(),
            dir: v.optional(v.string()),
            fileName: v.optional(v.string()),
          }),
        ),
        dir: v.string(),
        autoUnzip: v.boolean(),
        strip: v.number(),
      }),
    )
    .subscription(async ({ input, ctx }) => {
      return observable<any>((ob) => {
        const downloadService = ctx.injector.get(DownloadService);
        const workspace = ctx.injector.get(WorkspaceService);
        const progressLog = createMessage2Log();
        const log = ctx.injector.get(LogService).getToken('download');
        (async () => {
          try {
            const absDir = workspace.nFolder()
              ? path.resolve(workspace.nFolder(), input.dir)
              : path.normalize(input.dir);
            for (const item of input.fileList) {
              const url = item.url;
              await downloadService.download(url, {
                output: item.dir ? path.resolve(absDir, item.dir) : absDir,
                fileName: item.fileName,
                disableUnzip: !input.autoUnzip,
                strip: input.strip,
                progressMessage: (message) => {
                  const result = progressLog(message);
                  if (result) {
                    ob.next(result);
                    log?.info(result.message);
                  }
                },
              });
            }
          } catch (rej) {
            log?.info(`下载失败`);
            log?.info(rej);
            ob.error(rej);
          } finally {
            ob.complete();
          }
        })();
      });
    }),
});
