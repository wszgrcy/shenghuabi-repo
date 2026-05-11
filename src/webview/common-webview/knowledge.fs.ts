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
import { WorkspaceService } from '../../service/workspace.service';

import { path } from '@cyia/vfs2';
import { CustomKnowledgeManagerService } from '../../service/knowledge/custom-knowledge.manager.service';
import { LogFactoryService } from '../../service/log.service';
import { bufferDecodeToText } from '@shenghuabi/knowledge/file-parser';
import { dynamicInject } from '../../token';
import { KnowledgeConfigService } from '../../service/knowledge/knowledge-config.service';
/** 知识库的文档展示 */
export class KnowledgeFileSystem
  extends RootStaticInjectOptions
  implements FileSystemProvider
{
  static scheme = 'knowledgeVfs' as const;
  #channel = inject(LogFactoryService).getLog('knowledge');
  #workspace = inject(WorkspaceService);
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
    // 读取
    return this.#workspace.rootVfs.read(uri.fsPath).then((bf) => {
      return new Uint8Array(bf);
    });
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

  #knowledgeManager$$ = dynamicInject(CustomKnowledgeManagerService);
  #knowledgeConfig = inject(KnowledgeConfigService);
  async writeFile(
    uri: Uri,
    content: Uint8Array,
    options: { readonly create: boolean; readonly overwrite: boolean },
  ): Promise<void> {
    await this.#channel.createProgress('知识库文档更新');
    const filePath = uri.fsPath;
    const dir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    const config = await this.#knowledgeConfig.originConfig$$()[uri.query];
    await this.#knowledgeManager$$().updateItem(
      config.name,
      fileName,
      bufferDecodeToText(content),
    );

    // todo 数据库保存+本地保存
    await this.#workspace.rootVfs.write(filePath, content);

    // 向量数据库
    this.#channel.endProgress();
  }
  delete(
    uri: Uri,
    options: { readonly recursive: boolean },
  ): void | Thenable<void> {
    throw new Error('');
  }
}
