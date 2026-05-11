import { RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import {
  BehaviorSubject,
  catchError,
  filter,
  map,
  of,
  skip,
  take,
  takeUntil,
} from 'rxjs';
import { inject } from 'static-injector';

import { EventService } from '../event.service';
import {
  Disposable,
  Event,
  EventEmitter,
  FileChangeEvent,
  FileStat,
  FileSystemProvider,
  FileType,
  Uri,
} from 'vscode';
import { path } from '@cyia/vfs2';
import { PathMap } from '../../class/path.map';
import { v4 } from 'uuid';

import { ExtensionContext } from '../../token';
import { errorFormatByNode } from '@share/util/format/error-format-node';
import { LogFactoryService } from '../log.service';

export class ScriptEditorFileSystem
  extends RootStaticInjectOptions
  implements FileSystemProvider
{
  static readonly scheme = 'EditorScript';
  #channel = inject(LogFactoryService).getLog('workflow');
  /** 传入文件用 */
  #tempFileMap = new PathMap<BehaviorSubject<Buffer>>();
  #eventService = inject(EventService);
  onDidChangeFile: Event<FileChangeEvent[]> = new EventEmitter<
    FileChangeEvent[]
  >().event;

  watch(
    uri: Uri,
    options: {
      readonly recursive: boolean;
      readonly excludes: readonly string[];
    },
  ): Disposable {
    return { dispose() {} };
  }
  async stat(uri: Uri): Promise<FileStat> {
    return {
      type: FileType.File,
      size: 0,
      mtime: Date.now(),
      ctime: Date.now(),
    };
  }
  readDirectory(
    uri: Uri,
  ): [string, FileType][] | Thenable<[string, FileType][]> {
    throw new Error('');
  }
  async readFile(uri: Uri): Promise<Uint8Array> {
    const content = this.#tempFileMap.get(uri.fsPath)!;
    // todo 如何重启时删除无用编辑器
    return new Uint8Array(content.value);
  }
  rename(
    oldUri: Uri,
    newUri: Uri,
    options: { readonly overwrite: boolean },
  ): void | Thenable<void> {
    throw new Error('');
  }
  createDirectory(uri: Uri): void | Thenable<void> {
    throw new Error('');
  }
  async writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { readonly create: boolean; readonly overwrite: boolean },
  ): Promise<void> {
    const data$ = this.#tempFileMap.get(uri.fsPath);
    data$!.next(Buffer.from(content));
  }
  delete(
    uri: Uri,
    options: { readonly recursive: boolean },
  ): void | Thenable<void> {
    throw new Error('');
  }
  #extensionContext = inject(ExtensionContext);
  /** 接口被调用 */
  async getSavedEditorScript({
    title,
    content,
    input,
    output,
  }: {
    title: string;
    content: string;
    input?: string[] | undefined;
    output?: string[] | undefined;
  }) {
    const filePath = `/${v4()}.ts`;
    const dtsDir = path.join(this.#extensionContext.extensionPath, 'code-node');
    const data$ = new BehaviorSubject(
      Buffer.from(`import { Util, NodeJsRequire, ChatJsonSchema } from "${dtsDir}";
type NodeReturn = (
   outputName: ${output && output.length ? output.map((a) => "'" + a + "'").join('|') + '|undefined' : 'undefined'},
) => Promise<{
  /** 出口数据 */
  value: any;
  /** 一般用于标识元数据,表示对话中使用了哪些引用 */
  extra?: {
    metadata?: { type: string; description: string; tooltip?: string };
  };
}>
async function main(
  parameters: Record<${input && input.length ? input.map((a) => "'" + a + "'").join('|') : 'never'},{value:any,extra?:any}>,
  util: Util,
  require: NodeRequire,
): NodeReturn {${content}}`),
    );

    this.#tempFileMap.set(filePath, data$ as BehaviorSubject<Buffer>);

    vscode.commands.executeCommand(
      'vscode.open',
      Uri.file(filePath).with({ scheme: ScriptEditorFileSystem.scheme }),
      { viewColumn: vscode.ViewColumn.Beside },
      title,
    );
    const {
      default: { ScriptKind },
    } = await import('typescript');
    const { createCssSelectorForTs } = await import(
      '@cyia/code-util/selector/ts'
    );
    return data$.pipe(
      takeUntil(
        this.#eventService.editorClose$$.pipe(
          filter(
            (item) =>
              item.scheme === ScriptEditorFileSystem.scheme &&
              path.normalize(item.fsPath) === filePath,
          ),
          take(1),
        ),
      ),
      skip(1),
      map((buffer) => {
        const data = buffer.toString();
        const selector = createCssSelectorForTs(data!, {
          scriptKind: ScriptKind.TS,
        });
        const node = selector.queryOne(
          'FunctionDeclaration:has(>Identifier[value=main])>Block>SyntaxList',
        );
        if (node) {
          return node.value.trim();
        } else {
          throw new Error(`脚本内容需要在 main 函数中`);
        }
      }),

      catchError((error) => {
        const str = errorFormatByNode(error);
        vscode.window.showErrorMessage(str);
        this.#channel.failed(str);
        return of(undefined);
      }),
      filter((a) => typeof a === 'string'),
    );
  }
}
