import { RootStaticInjectOptions, inject } from 'static-injector';

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

import querystring from 'node:querystring';
import { MindFileService } from '../../service/mind/mind-file.service';
import { WorkspaceService } from '../../service/workspace.service';
//读取zip文档中的数据或一些外部的数据
export class FlowVirtualFileSystem
  extends RootStaticInjectOptions
  implements FileSystemProvider
{
  static scheme = 'flow-vfs' as const;
  #mindFile = inject(MindFileService);
  #vfs = inject(WorkspaceService).rootVfs;
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
    const result = querystring.decode(uri.query);
    if (result['type'] === 'image') {
      const file = this.#mindFile.getFile(result['filePath']! as string);
      return file.readImageBuffer(uri.path.slice(1)).then((data) => {
        if (!data) {
          throw new Error(`${uri.path.slice(1)}: 图片已丢失`);
          // todo 应该返回一个404图片
        }
        return data;
      });
    } else if (result['type'] === 'plugin') {
      return this.#vfs.readFile(result['filePath'] as string);
    } else {
      throw new Error('未实现');
    }
  }
  rename(
    oldUri: Uri,
    newUri: Uri,
    options: { readonly overwrite: boolean },
  ): void | Thenable<void> {}
  createDirectory(uri: Uri): void | Thenable<void> {}

  async writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { readonly create: boolean; readonly overwrite: boolean },
  ): Promise<void> {}
  delete(
    uri: Uri,
    options: { readonly recursive: boolean },
  ): void | Thenable<void> {}
}
