import { RootStaticInjectOptions, inject, signal } from 'static-injector';
import * as vscode from 'vscode';

import { WorkspaceService } from '../../../service/workspace.service';
import { WatchService } from '../../../service/fs/watch.service';
import { CommandPrefix } from '@global';
import { setMindRelationLabel } from '../../../util/mind-relation-label';
import { max } from 'lodash-es';
import { CardDataType, ChatDataType } from '../../../share';
import { path } from '@cyia/vfs2';

export class MindTreeItem extends vscode.TreeItem {
  from?: string;
  index?: number;
  selection?: vscode.Selection;
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public getChildren: () => Promise<MindTreeItem[]>,
  ) {
    super(label, collapsibleState);
  }
}

export class MindTree
  extends RootStaticInjectOptions
  implements vscode.TreeDataProvider<MindTreeItem>
{
  static viewType = `shenghuabi.mind.tree`;
  #onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this.#onDidChangeTreeData.event;
  #watchService = inject(WatchService);
  #list = signal<MindTreeItem[]>([]);
  #workspace = inject(WorkspaceService);
  // 脑图,但是仅工作区显示tree
  listen() {
    this.#watchService.fileObject$.subscribe((data) => {
      const dir = this.#workspace.nFolder();
      if (!dir) {
        return;
      }
      const result = data.map((fileItem) => {
        const instance = new MindTreeItem(
          path.relative(dir, fileItem.filePath),
          vscode.TreeItemCollapsibleState.Expanded,
          async () => {
            return fileItem.children
              .filter(
                (item) =>
                  (item.type === 'card' || item.type === 'chat') &&
                  item.data.title,
              )
              .map((child) => {
                const children: MindTreeItem[] = [];
                if (child.relation) {
                  if (child.relation.output.length) {
                    children.push(
                      ...child.relation!.output.map((subItem) => {
                        const instance = new MindTreeItem(
                          setMindRelationLabel(
                            subItem.edge.label,
                            (subItem.node.data as any)['title'],
                          ),
                          vscode.TreeItemCollapsibleState.None,
                          async () => [],
                        );
                        instance.command = {
                          command: `${CommandPrefix}.mind.focus-node`,
                          title: '',
                          arguments: [fileItem.filePath, subItem.node.id],
                        };
                        return instance;
                      }),
                    );
                  }
                  if (children.length) {
                    const length = Math.max(
                      (max(children.map((item) => item.label.length))! - 1) * 2,
                      2,
                    );
                    children.push(
                      new MindTreeItem(
                        `<${'-'.repeat(length)}>`,
                        vscode.TreeItemCollapsibleState.None,
                        async () => [],
                      ),
                    );
                  }
                  if (child.relation.input.length) {
                    children.push(
                      ...child.relation!.input.map((subItem) => {
                        const instance = new MindTreeItem(
                          setMindRelationLabel(
                            subItem.edge.label,
                            (subItem.node.data as any)['title'],
                            true,
                          ),
                          vscode.TreeItemCollapsibleState.None,
                          async () => [],
                        );
                        instance.command = {
                          command: `${CommandPrefix}.mind.focus-node`,
                          title: '',
                          arguments: [fileItem.filePath, subItem.node.id],
                        };
                        return instance;
                      }),
                    );
                  }

                  child.relation.input;
                }

                const childInstance = new MindTreeItem(
                  (child.data as ChatDataType | CardDataType).title!,
                  children.length
                    ? vscode.TreeItemCollapsibleState.Collapsed
                    : vscode.TreeItemCollapsibleState.None,
                  async () => children,
                );
                childInstance.command = {
                  command: `${CommandPrefix}.mind.focus-node`,
                  title: '',
                  arguments: [fileItem.filePath, child.id],
                };
                return childInstance;
              });
          },
        );
        return instance;
      });
      this.#list.set(result);
      this.refresh();
    });
  }
  refresh() {
    this.#onDidChangeTreeData.fire(undefined);
  }
  // 加一个新建，一个右键？ 编辑。删除？
  async getChildren(
    element?: MindTreeItem | undefined,
  ): Promise<MindTreeItem[]> {
    if (!element) {
      return this.#list();
    }
    return element.getChildren();
  }
  getTreeItem(
    element: MindTreeItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  // 非直接修改. 而是只能删除。编辑器修改内容 .修改文件名？
  async deleteItem(dir: string, fileName: string) {}
}
