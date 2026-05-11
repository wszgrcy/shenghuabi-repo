import { RootStaticInjectOptions, inject, signal } from 'static-injector';
import * as vscode from 'vscode';

import {
  FolderName,
  WorkspaceService,
} from '../../../service/workspace.service';
import { KnowledgeQueryOptions } from '../../../share';
import { unionBy } from 'lodash-es';
import { CommandPrefix } from '@global';
import { KnowledgeTreeItem } from '../knowledge/knowledge.tree';
import { ExtensionConfig } from '../../../service/config.service';
import { path } from '@cyia/vfs2';

import { KnowledgeTreeItemData } from '../../../service/vector/knowledge-config.define';
import { KnowledgeItemType } from '../../../share/define/knowledge/working-knowledge';
import { CustomKnowledgeManagerService } from '../../../service/knowledge/custom-knowledge.manager.service';
import {
  FileChunkPayload,
  FileChunkPayloadDefine,
} from '@shenghuabi/knowledge/knowledge';
import * as v from 'valibot';
import { dynamicInject } from '../../../token';
import { KnowledgeConfigService } from '../../../service/knowledge/knowledge-config.service';
export class KnowledgeQueryResultItem extends vscode.TreeItem {
  from?: string;
  data?: KnowledgeTreeItemData;
  index?: number;
  replaceFn?: () => Promise<any>;
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public getChildren: () => Promise<KnowledgeQueryResultItem[]>,
  ) {
    super(label, collapsibleState);
  }
}
export const KnowledgeDirContextValue = 'knowledgeDirContextValue';
export const KnowledgeFileContextValue = 'knowledgeFileContextValue';
// todo 还没有实现结果
export class KnowledgeQueryResultTree
  extends RootStaticInjectOptions
  implements vscode.TreeDataProvider<KnowledgeQueryResultItem>
{
  static viewType = `shenghuabi.knowledge-query.result-tree`;
  #onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this.#onDidChangeTreeData.event;
  refresh() {
    this.#onDidChangeTreeData.fire(undefined);
  }
  // 加一个新建，一个右键？ 编辑。删除？
  #knowledgeManager$$ = dynamicInject(CustomKnowledgeManagerService);
  #knowledgeConfig$$ = inject(KnowledgeConfigService);
  result = signal<KnowledgeQueryResultItem[]>([]);
  async getChildren(
    element?: KnowledgeQueryResultItem | undefined,
  ): Promise<KnowledgeQueryResultItem[]> {
    if (!element) {
      return this.result();
    }
    return element.getChildren();
  }
  getTreeItem(
    element: KnowledgeQueryResultItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  // 非直接修改. 而是只能删除。编辑器修改内容 .修改文件名？
  async deleteItem(dir: string, fileName: string) {}

  async queryKnowledge(
    options: KnowledgeQueryOptions,
    autoActivate: boolean,
    changeData?: (value: string) => Promise<boolean>,
  ) {
    if (!options.query || (!options.range.dict && !options.range.knowledge)) {
      this.result.set([]);
      return this.refresh();
    }
    if (autoActivate) {
      vscode.commands.executeCommand(
        `shenghuabi.knowledge-query.result-tree.focus`,
      );
    }

    const resultList = [];
    const list = await this.getAvailableKnowledgeList();
    const limit = ExtensionConfig['knowledge.query'].limit();
    for (const knowledgeItem of list) {
      if (knowledgeItem.type === 'dict') {
        if (!options.range.dict) {
          continue;
        }
      } else if (!options.range.knowledge) {
        continue;
      }
      let result = await (
        await this.#knowledgeManager$$().get(knowledgeItem.name)
      )
        .searchChunk(options.query, undefined, { limit })
        .then((list) => list.map((item) => item.payload));

      if (knowledgeItem.type !== 'dict') {
        resultList.push(
          this.#getKnowledgeNodeList(
            // todo 知识库解析
            result.map((payload) => ({
              ...v.parse(FileChunkPayloadDefine, payload),
              knowledge: knowledgeItem.name,
            })),
            knowledgeItem,
          ),
        );
      } else {
        result = unionBy(result.filter(Boolean), (item) => item!['word']);
        const instance = new KnowledgeQueryResultItem(
          knowledgeItem.name,
          vscode.TreeItemCollapsibleState.Expanded,
          async () => {
            return result.map((item) => {
              const subInstance = new KnowledgeQueryResultItem(
                item!['word'] as string,
                vscode.TreeItemCollapsibleState.None,
                async () => [],
              );
              subInstance.command = {
                command: `${CommandPrefix}.knowledge-query.open-dict-item`,
                title: '',
                arguments: [item, knowledgeItem],
              };
              if (options.source === 'codeAction') {
                subInstance.contextValue = 'knowledgeQueryReplaceContextValue';
                subInstance.replaceFn = () => {
                  return changeData!(item!['word'] as any);
                };
              }
              return subInstance;
            });
          },
        );
        resultList.push(instance);
      }
      this.result.set(resultList.slice());
      this.refresh();
    }
  }

  #workspace = inject(WorkspaceService);
  // todo 加了图索引知识库,但是元数据和原来不一样了,需要整理看看其他地方是否有异常
  #getKnowledgeNodeList(
    payloadList: (FileChunkPayload & { knowledge: string })[],
    parent: KnowledgeItemType,
  ) {
    const pathDir = this.#workspace.dir[FolderName.knowledgeDir]();
    const parentNode = new KnowledgeTreeItem(
      parent.name,
      vscode.TreeItemCollapsibleState.Expanded,
      async () => {
        return payloadList
          .filter((item) => Object.keys(item).length)
          .map((payload) => {
            const fileTreeItem = new KnowledgeTreeItem(
              payload.chunk,
              vscode.TreeItemCollapsibleState.None,
              async () => {
                return [];
              },
            );
            fileTreeItem.data = {
              fileName: payload.fileName,
              dir: path.join(pathDir, payload.knowledge),
              config: parent,
            };
            fileTreeItem.contextValue = KnowledgeFileContextValue;
            fileTreeItem.command = {
              command: 'shenghuabi.knowledge.tree.item.edit',
              title: '',
              arguments: [fileTreeItem],
            };
            fileTreeItem.selection = new vscode.Selection(
              new vscode.Position(payload.loc.lines.from - 1, 0),
              new vscode.Position(payload.loc.lines.to, 0),
            );
            return fileTreeItem;
          });
      },
    );
    return parentNode;
  }
  async getAvailableKnowledgeList() {
    const list = await this.#knowledgeConfig$$.originConfigList$();
    const queryList = ExtensionConfig['knowledge.query'].list();
    if (!queryList) {
      return list;
    }
    return queryList
      .map((key) => {
        const item = list.find((_item) => _item.name === key);
        return item!;
      })
      .filter(Boolean);
  }
}
