import {
  Injector,
  RootStaticInjectOptions,
  computed,
  inject,
} from 'static-injector';
import * as vscode from 'vscode';

import { ExtensionContext } from '../token';
import { ExtensionConfig } from './config.service';
import { sysJoin } from '../util/fs.util';
import { TemplateFormatService } from '@shenghuabi/workflow';
import escape from 'regexp.escape';
import { createNormalizeVfs, path } from '@cyia/vfs2';
import { invert } from 'lodash-es';
import * as fs from 'fs';

// import { VSCodeVFS } from './fs/vscode.vfs';
// todo 各种配置也可以加这个
export const enum FolderName {
  llamaDir = 'llamaDir',
  qdrantDir = 'qdrantDir',
  text2vecDir = 'text2vecDir',
  reRankerDir = 'reRankerDir',
  knowledgeDir = 'knowledgeDir',
  selectionPromptDir = 'selectionPromptDir',
  commonPromptDir = 'commonPromptDir',
  workflowDir = 'workflowDir',
  ocrDir = 'ocrDir',
  updatePackageDir = 'updatePackageDir',
  mindDir = 'mindDir',
  articleBaseConfig = 'articleBaseConfig',
  chatHistory = 'chatHistory',
  pythonAddon = 'pythonAddon',
}
type Path = string;
export class WorkspaceService extends RootStaticInjectOptions {
  // fixme 目前就认为一个工作空间
  #folder = vscode.workspace.workspaceFolders?.[0];
  /** 变动就会重载 */
  nFolder = computed(() => {
    return this.#folder?.uri.fsPath || '';
  });
  getRelFilePath2(filePath: string) {
    let nFolder = this.nFolder();
    const fileDir = path.dirname(filePath);
    if (!nFolder) {
      nFolder = fileDir;
    }
    const maybeRel = path.relative(nFolder, filePath);
    if (maybeRel.startsWith('..')) {
      return {
        dir: fileDir,
        relFilePath: path.basename(filePath),
      };
    }
    return {
      dir: nFolder,
      relFilePath: maybeRel,
    };
  }
  #extensionContext = inject(ExtensionContext);
  #injector = inject(Injector);

  vfs = createNormalizeVfs({ dir: this.nFolder() });
  /** 与工作区无关的处理 */
  rootVfs = createNormalizeVfs({});
  get #textDocuments() {
    return vscode.workspace.textDocuments;
  }
  #findTextDocument(input: string) {
    for (const item of this.#textDocuments) {
      if (item.uri.scheme !== 'file') {
        continue;
      }
      if (path.normalize(item.uri.fsPath) === input) {
        return item;
      }
    }
    return undefined;
  }
  readFileByVSC(path: string) {
    const textDocument = this.#findTextDocument(path);
    return textDocument
      ? textDocument.getText()
      : fs.readFileSync(path, { encoding: 'utf-8' });
  }
  async listAllTree<T>(
    filePath: Path,
    filter: (path: Path, fullPath: Path, isDir: boolean) => boolean,
    map: (path: Path, fullPath: Path, children: T[] | undefined) => Promise<T>,
  ): Promise<T[]> {
    const list = await this.vfs.list(filePath);
    const allList: T[] = [];
    for (const item of list) {
      const fullPath = path.join(filePath, item);
      const isDir = await this.vfs.isDirectory(fullPath);
      const keep = filter(item, fullPath, isDir);
      if (!keep) {
        continue;
      }
      if (isDir) {
        const children = await this.listAllTree(fullPath, filter, map);
        allList.push(await map(item, fullPath, children));
      } else {
        allList.push(await map(item, fullPath, undefined));
      }
    }
    return allList;
  }
  /** vscode 弹窗使用 */
  async listAllTree2<T>(
    filePath: Path,
    filter: (path: Path, fullPath: Path, isDir: boolean) => boolean,
    map: (path: Path, fullPath: Path, children: T[] | undefined) => T,
    currentDir = '',
  ): Promise<T[]> {
    const list = await this.vfs.list(filePath);
    const allList: T[] = [];
    for (const item of list) {
      const wRelativePath = path.join(currentDir, item);
      const isDir = await this.vfs.isDirectory(wRelativePath);
      const keep = filter(item, wRelativePath, isDir);
      if (!keep) {
        continue;
      }
      if (isDir) {
        const children = await this.listAllTree2(
          wRelativePath,
          filter,
          map,
          wRelativePath,
        );
        allList.push(...children);
      } else {
        allList.push(map(item, wRelativePath, undefined));
      }
    }
    return allList;
  }
  #pathListMap() {
    return {
      extensionFolder: this.#extensionContext.extensionPath,
      workspaceFolder: this.nFolder(),
    };
  }
  #templateFormat = inject(TemplateFormatService);
  formatPath(input: string) {
    return this.#templateFormat.interpolate(input, this.#pathListMap());
  }

  shortPath(input: string) {
    const obj = this.#pathListMap();
    const regexp = new RegExp(
      `^(${Object.values(obj)
        .map((value) => escape(value))
        .join('|')})`,
    );

    return input.replace(regexp, (substr) => {
      return `{{${invert(obj)[substr]}}}`;
    });
  }
  /** 一些配置的dir,不仅dir */
  getDir(dir: string, defaultDir: string | undefined, defaultName: string) {
    let outputPath;
    if (dir.trim()) {
      outputPath = dir.trim();
    } else if (defaultDir?.trim()) {
      outputPath = sysJoin(defaultDir.trim(), defaultName.trim());
    } else {
      return '';
    }
    return outputPath ? this.formatPath(outputPath) : '';
  }
  getWorkflowName(filePath: string) {
    const dir = this.dir[FolderName.workflowDir]();
    return path.relative(dir, filePath).replace(/\.workflow$/, '');
  }

  joinWorkflowName(name: string) {
    const dir = this.dir[FolderName.workflowDir]();
    return path.join(dir, name + '.workflow');
  }
  dir = {
    [FolderName.llamaDir]: computed(() => {
      return this.getDir(
        ExtensionConfig['llama.dir']?.() || '',
        ExtensionConfig.defaultDir(),
        'llama',
      );
    }),
    [FolderName.qdrantDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.vector_database?.dir?.() || '',
        ExtensionConfig.defaultDir(),
        'qdrant',
      );
    }),
    [FolderName.text2vecDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.text2vec?.dir?.() || '',
        ExtensionConfig.defaultDir(),
        'text2vec',
      );
    }),
    [FolderName.knowledgeDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.knowledge_base?.dir?.() || '',
        ExtensionConfig.defaultDir(),
        'knowledge_base',
      );
    }),
    [FolderName.selectionPromptDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.prompt.selection?.() || '',
        ExtensionConfig.defaultDir(),
        'prompt/selection_prompt.yml',
      );
    }),
    [FolderName.commonPromptDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.prompt.common?.() || '',
        ExtensionConfig.defaultDir(),
        'prompt/common_prompt.yml',
      );
    }),
    [FolderName.workflowDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.workflow.dir?.() || '',
        ExtensionConfig.defaultDir(),
        'workflow',
      );
    }),
    [FolderName.ocrDir]: computed(() => {
      return this.getDir(
        ExtensionConfig['ocr.dir']?.() || '',
        ExtensionConfig.defaultDir(),
        'ocr',
      );
    }),

    [FolderName.updatePackageDir]: computed(() => {
      return sysJoin(ExtensionConfig.defaultDir()!, 'update');
    }),
    [FolderName.mindDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.mind.dir?.() || '',
        ExtensionConfig.defaultDir(),
        'mind',
      );
    }),
    [FolderName.articleBaseConfig]: computed(() => {
      return this.getDir('', ExtensionConfig.defaultDir(), 'articleBase.yml');
    }),
    [FolderName.chatHistory]: computed(() => {
      return this.getDir(
        ExtensionConfig.chatHistory.dir() ?? '',
        ExtensionConfig.defaultDir(),
        'chat-history',
      );
    }),
    [FolderName.pythonAddon]: computed(() => {
      return this.getDir(
        ExtensionConfig.pythonAddon.dir() ?? '',
        ExtensionConfig.defaultDir(),
        'pythonAddon',
      );
    }),
    [FolderName.reRankerDir]: computed(() => {
      return this.getDir(
        ExtensionConfig.reranker.dir() ?? '',
        ExtensionConfig.defaultDir(),
        'reranker',
      );
    }),
  };
  async tryToCreate(filePath: string, buffer: Buffer) {
    await this.vfs.write(filePath, new Uint8Array(buffer));
  }
}
