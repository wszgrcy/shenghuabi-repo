import { RootStaticInjectOptions, effect, inject } from 'static-injector';
import * as vscode from 'vscode';

import {
  FolderName,
  WorkspaceService,
} from '../../../service/workspace.service';
import { path } from '@cyia/vfs2';
import { CommandPrefix } from '@global';
import { KnowledgeTreeItemData } from '../../../service/vector/knowledge-config.define';
import { NumberCompare } from '../../../util/number-compare';
import { CustomKnowledgeManagerService } from '../../../service/knowledge/custom-knowledge.manager.service';
import { dynamicInject } from '../../../token';
import { KnowledgeConfigService } from '../../../service/knowledge/knowledge-config.service';

export class KnowledgeTreeItem extends vscode.TreeItem {
  from?: string;
  data?: KnowledgeTreeItemData;
  index?: number;
  selection?: vscode.Selection;
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public getChildren: () => Promise<KnowledgeTreeItem[]>,
  ) {
    super(label, collapsibleState);
  }
}
export const KnowledgeDirContextValue = 'knowledgeDirContextValue';
export const KnowledgeFileContextValue = 'knowledgeFileContextValue';
/** 知识库展示 */
export class KnowledgeTree
  extends RootStaticInjectOptions
  implements vscode.TreeDataProvider<KnowledgeTreeItem>
{
  static viewType = `shenghuabi.knowledge.tree`;
  #onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this.#onDidChangeTreeData.event;
  refresh() {
    this.#onDidChangeTreeData.fire(undefined);
  }
  #knowledgeManager$$ = dynamicInject(CustomKnowledgeManagerService);
  #knowledgeConfig = inject(KnowledgeConfigService);
  constructor() {
    super();
    effect(() => {
      this.#knowledgeConfig.originConfigList$();
      this.refresh();
    });
  }
  // 加一个新建，一个右键？ 编辑。删除？
  #workspace = inject(WorkspaceService);
  async getChildren(
    element?: KnowledgeTreeItem | undefined,
  ): Promise<KnowledgeTreeItem[]> {
    /**
     * 树。 一级 知识库名字
     * 二级 文件名字
     * 三级？元数据？分隔条数之类的？或则没有
     * 读的是实体文件。然后根据尸体文件更新数据库
     * 允许强制同步
     */
    const pathDir = this.#workspace.dir[FolderName.knowledgeDir]();
    if (!pathDir) {
      console.warn('无知识库文件夹');
      return [];
    }

    if (!element) {
      const list = (await this.#knowledgeConfig.originConfigList$()).map(
        (configItem, index) => {
          const data = {
            fileName: configItem.name,
            dir: pathDir,
            config: configItem,
          };
          if (configItem.type === 'dict') {
            const instance = new KnowledgeTreeItem(
              configItem.name,
              vscode.TreeItemCollapsibleState.Collapsed,
              async () => {
                return this.#knowledgeManager$$()
                  .get(configItem.name)
                  .then((instance) => instance.getCollection())
                  .then((a) => {
                    return [
                      new KnowledgeTreeItem(
                        `共${a.points_count}条`,
                        vscode.TreeItemCollapsibleState.None,
                        async () => [],
                      ),
                    ];
                  });
              },
            );
            instance.data = data!;
            instance.contextValue = KnowledgeDirContextValue;
            instance.index = index;
            return instance;
          }
          // 一级
          const knowledgeDir = new KnowledgeTreeItem(
            configItem.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            async () => {
              const dir = path.join(data.dir, data.fileName);
              const list = await this.#workspace.rootVfs.list(dir);

              const itemList = list.sort(NumberCompare).map((item, index) => {
                const data = { fileName: item, dir, config: configItem };
                // 二级
                const fileTreeItem = new KnowledgeTreeItem(
                  item,
                  vscode.TreeItemCollapsibleState.None,
                  async () => {
                    return [];
                  },
                );
                fileTreeItem.data = data!;
                fileTreeItem.contextValue = KnowledgeFileContextValue;
                fileTreeItem.index = index;
                fileTreeItem.command = {
                  command: 'shenghuabi.knowledge.tree.item.edit',
                  title: '',
                  arguments: [fileTreeItem],
                };
                return fileTreeItem;
              });
              const graphList = [];
              if (data.config.graphIndex) {
                const instance = new KnowledgeTreeItem(
                  `图谱`,
                  vscode.TreeItemCollapsibleState.None,
                  async () => [],
                );
                instance.iconPath = new vscode.ThemeIcon('graph-scatter');
                instance.command = {
                  command: `${CommandPrefix}.knowledge.graph.open`,
                  title: '',
                  arguments: [data],
                };
                graphList.push(instance);
              }
              return [...graphList, ...itemList];
            },
          );
          knowledgeDir.data = data!;
          knowledgeDir.contextValue = KnowledgeDirContextValue;
          knowledgeDir.index = index;
          return knowledgeDir;
        },
      );

      return list;
    }
    return element.getChildren();
  }
  getTreeItem(
    element: KnowledgeTreeItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
}
