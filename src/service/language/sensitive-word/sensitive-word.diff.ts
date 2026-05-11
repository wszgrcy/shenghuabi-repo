import { inject, RootStaticInjectOptions } from 'static-injector';
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
import * as vscode from 'vscode';
import { ExtensionContext } from '../../../token';
import { WorkspaceService } from '../../workspace.service';

import { v4 } from 'uuid';
import { path } from '@cyia/vfs2';
// 需要写缓存，

export class SentenceDiffSystem
  extends RootStaticInjectOptions
  implements FileSystemProvider
{
  #context = inject(ExtensionContext);
  #vfs = inject(WorkspaceService).rootVfs;
  static scheme = 'editorWorkflowChanged';
  #event = new EventEmitter<FileChangeEvent[]>();
  onDidChangeFile: Event<FileChangeEvent[]> = this.#event.event;
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
    const result = this.#vfs.stat(uri.fsPath);
    if (!result) {
      return {
        type: FileType.File,
        size: 0,
        mtime: Date.now() / 1000,
        ctime: 0,
      };
    }
    const data = await result;
    if (!data) {
      return {
        type: FileType.File,
        size: 0,
        mtime: Date.now() / 1000,
        ctime: 0,
      };
    }
    return {
      type: FileType.File,
      size: data.size,
      mtime: Date.now() / 1000,
      ctime: 0,
    };
  }
  readDirectory(
    uri: Uri,
  ): [string, FileType][] | Thenable<[string, FileType][]> {
    throw new Error('readDirectory');
  }
  async readFile(uri: Uri): Promise<Uint8Array> {
    return new Uint8Array(await this.#vfs.read(uri.fsPath));
  }
  rename(
    oldUri: Uri,
    newUri: Uri,
    options: { readonly overwrite: boolean },
  ): void | Thenable<void> {
    throw new Error('rename');
  }
  createDirectory(uri: Uri): void | Thenable<void> {
    throw new Error('');
  }
  async writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { readonly create: boolean; readonly overwrite: boolean },
  ) {
    throw new Error(`请使用标题上的保存按钮保存左侧内容`);
  }
  delete(
    uri: Uri,
    options: { readonly recursive: boolean },
  ): void | Thenable<void> {
    throw new Error('delete');
  }

  async openDiff(uri: vscode.Uri, content: string, suffix: string) {
    const templatePath = path.join(
      this.#context.storageUri!.fsPath,
      `${path.basename(uri.fsPath)}-${suffix}-${v4()}`,
    );
    await this.#vfs.write(templatePath, content);
    vscode.commands.executeCommand(
      'vscode.diff',
      Uri.file(templatePath).with({
        scheme: SentenceDiffSystem.scheme,
      }),
      uri,
      `工作流修改对比-${path.basename(uri.fsPath)}`,
      {
        viewColumn: vscode.ViewColumn.Active,
      },
    );
  }
}
