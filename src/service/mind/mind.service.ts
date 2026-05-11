import { computed, inject, signal } from 'static-injector';
import { RootStaticInjectOptions } from 'static-injector';
import { FolderName, WorkspaceService } from '../workspace.service';

import fs from 'fs';
import { transform as cssTransform } from 'lightningcss';
import { path } from '@cyia/vfs2';
import { WatchService } from '../fs/watch.service';
import * as vscode from 'vscode';
import { CardMindNode } from '../../share';
export class MindService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  updateIndex = signal(0);
  #vfs = this.#workspace.rootVfs;
  /** 模板 */
  nodeTemplatePath = () => {
    const dir = this.#workspace.dir[FolderName.mindDir]();
    return path.join(dir, 'node-template.json');
  };
  /** 主题 */
  async themeDir() {
    const dir = this.#workspace.dir[FolderName.mindDir]();
    const themeDir = path.join(dir, 'node-theme');
    if (!(await this.#vfs.exists(themeDir))) {
      await this.#vfs.mkdir(themeDir, { recursive: true });
    }
    return themeDir;
  }
  getAllNodeTemplateData = computed(() => {
    return this.#workspace.rootVfs
      .readContent(this.nodeTemplatePath())
      .then((item) => {
        return JSON.parse(item || '{}') as Record<string, any>;
      });
  });
  /** 保存模板 */
  async saveNodeTemplateItem(input: { name: string; data: any }) {
    const data = await this.getAllNodeTemplateData();
    data[input.name] = input.data;
    await this.themeDir();
    await this.#workspace.rootVfs.write(
      this.nodeTemplatePath(),
      JSON.stringify(data),
    );
    this.updateIndex.update((v) => v + 1);
  }
  async getAllNodeThemeList() {
    const dir = await this.themeDir();
    return this.#workspace.rootVfs.list(dir);
  }
  #themeCache = {} as Partial<Record<string, Promise<string>>>;
  async getNodeThemeItem(fileName: string) {
    if (this.#themeCache[fileName]) {
      return this.#themeCache[fileName];
    }
    const dir = await this.themeDir();
    const filePath = path.join(dir, fileName);
    this.#themeCache[fileName] = this.#workspace.rootVfs
      .read(path.join(dir, fileName))
      .then((item) => {
        return cssTransform({
          code: new Uint8Array(item),
          filename: '',
          errorRecovery: true,
          minify: true,
          // 因为用二进制表示,所以很大
          // https://lightningcss.dev/transpilation.html
          // 临时修复,突然不支持css嵌套了
          targets: { chrome: 7798784 },
        }).code.toString();
      })
      .catch(() => '');
    (async () => {
      for await (const item of fs.promises.watch(filePath)) {
        delete this.#themeCache[fileName];
        break;
      }
    })();
    return this.#themeCache[fileName];
  }

  async createNewTheme(options: {
    type: string;
    kind: string;
    fileName: string;
  }) {
    const dir = await this.themeDir();
    const cssName = options.fileName + '.css';
    if (options.type === 'node') {
      const str: string[] = [];
      if (options.kind === 'card') {
        const cssPath = this.#workspace.formatPath(
          `{{extensionFolder}}/data/style/node-theme.template.css`,
        );
        const content = await fs.promises.readFile(cssPath, {
          encoding: 'utf-8',
        });
        str.push(content);
      } else {
        str.push(`/** 默认调整样式 */`, `:scope{}`);
      }
      const filePath = path.join(dir, cssName);

      await this.#workspace.rootVfs.write(filePath, str.join('\n'));
      return filePath;
    }
    throw '';
  }
  #watch = inject(WatchService);
  #cardList$$ = computed(() => {
    const list = this.#watch.mindList$() || [];
    return list.flatMap((fileItem) =>
      (fileItem.children as any as CardMindNode[])
        .filter((item) => item.type === 'card' && item.data.title)
        .map((item) => {
          return {
            mixId: `${fileItem.id}/${item.id}`,
            filePath: fileItem.filePath,
            relPath: fileItem.relPath,
            ...item,
          };
        }),
    );
  });
  /** 选择使用 */
  #cardPickList$$ = computed(() => {
    const list = this.#cardList$$();
    return list.map((item) => {
      return {
        label: item.data.title,
        description: item.relPath,
        node: item,
        nodeLabel: `[${item.relPath.replace(/\.(nt|naotu)$/, '')}]${item.data.title}`,
      } as vscode.QuickPickItem;
    });
  });
  /** 工作流节点使用 */
  cardObject$$ = computed(() => {
    const list = this.#cardList$$() || [];
    return list.reduce(
      (obj, item) => {
        obj[item.mixId] = item;
        return obj;
      },
      {} as Record<string, CardMindNode & { filePath: string }>,
    );
  });
  async getCardList() {
    const list = this.#cardPickList$$();
    const result = await vscode.window.showQuickPick(list, {
      canPickMany: true,
    });
    return result?.map(
      (item) =>
        ({
          label: (item as any)['nodeLabel'],
          value: (item as any)['node']['mixId'],
        }) as { value: string; label: string },
    );
    // return picker?.['node'] as CardMindNode[];
  }
}
