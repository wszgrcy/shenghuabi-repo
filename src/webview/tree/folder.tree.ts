import { RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { FolderName } from '../../service/workspace.service';

import { CommandPrefix } from '@global';
import { SHB_NATIVE } from '../../native/api';
import { path } from '@cyia/vfs2';

export class FolderTreeItem extends vscode.TreeItem {
  promptData?: { filePath: string };
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public getChildren: () => Promise<FolderTreeItem[]>,
  ) {
    super(label, collapsibleState);
  }
}
export class FolderTree
  extends RootStaticInjectOptions
  implements vscode.TreeDataProvider<FolderTreeItem>
{
  static viewType = 'shenghuabi.folder';
  #onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this.#onDidChangeTreeData.event;
  refresh() {
    this.#onDidChangeTreeData.fire(undefined);
  }

  async getChildren(
    element?: FolderTreeItem | undefined,
  ): Promise<FolderTreeItem[]> {
    if (!element) {
      const list = [
        {
          label: 'qdrant(向量数据库)',
          children: [
            {
              label: `安装位置`,
              value: FolderName.qdrantDir,
            },
            {
              label: `模型位置`,
              value: FolderName.text2vecDir,
            },
          ],
        },
        {
          label: `知识库`,
          children: [
            {
              label: `位置`,
              value: FolderName.knowledgeDir,
            },
          ],
        },
        {
          label: `对话模板`,
          children: [
            {
              label: `选中处理位置`,
              value: FolderName.selectionPromptDir,
              isFile: true,
            },
            {
              label: `通用位置`,
              value: FolderName.commonPromptDir,
              isFile: true,
            },
          ],
        },
        {
          label: `工作流`,
          children: [
            {
              label: `保存文件夹`,
              value: FolderName.workflowDir,
            },
          ],
        },
        {
          label: `工具`,
          children: [
            {
              label: `图像转文本`,
              value: FolderName.ocrDir,
            },
          ],
        },
        {
          label: `脑图`,
          children: [
            {
              label: `文件夹`,
              value: FolderName.mindDir,
            },
            {
              label: `主题`,
              childrenFn: async () => {
                return [
                  { type: 'node', kind: 'card', label: '创建卡片节点主题' },
                  { type: 'node', kind: 'other', label: '创建其他节点主题' },
                ].map((data) => {
                  const item = new FolderTreeItem(
                    data.label,
                    vscode.TreeItemCollapsibleState.None,
                    async () => {
                      return [];
                    },
                  );
                  item.iconPath = new vscode.ThemeIcon('add');
                  item.command = {
                    command: `${CommandPrefix}.mind.theme.create`,
                    title: '',
                    arguments: [data],
                  };
                  return item;
                });
              },
            },
          ],
        },
      ].map((configItem) => {
        const codeActionItem = new FolderTreeItem(
          configItem.label,
          vscode.TreeItemCollapsibleState.Expanded,
          async () => {
            return configItem.children.map((item, index) => {
              const treeItem = new FolderTreeItem(
                item.label,
                'childrenFn' in item
                  ? vscode.TreeItemCollapsibleState.Collapsed
                  : vscode.TreeItemCollapsibleState.None,
                async () => {
                  return [];
                },
              );
              if ('childrenFn' in item && item.childrenFn) {
                treeItem.getChildren = item.childrenFn;
              } else {
                treeItem.contextValue = 'folder';
                treeItem.command = {
                  command: 'shenghuabi.open-folder',
                  title: '',
                  arguments: [item.value, item],
                };
              }
              return treeItem;
            });
          },
        );
        return codeActionItem;
      });

      return list;
    }
    return element.getChildren();
  }
  getTreeItem(
    element: FolderTreeItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
}
export function openFolder(file: string) {
  SHB_NATIVE.$call('electron', {
    method: 'openPath',
    parameters: [path.normalize(file)],
  });
}
