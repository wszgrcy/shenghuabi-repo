import { inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { FolderName, WorkspaceService } from '../../service/workspace.service';
import { path } from '@cyia/vfs2';
import { NumberCompare } from '../../util/number-compare';
const SUFFIX = `.workflow`;
export class WorkflowTreeItem extends vscode.TreeItem {
  filePath!: string;
  isDir!: boolean;
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public getChildren: () => Promise<WorkflowTreeItem[]>,
  ) {
    super(label, collapsibleState);
  }
}
export class WorkflowTree
  extends RootStaticInjectOptions
  implements vscode.TreeDataProvider<WorkflowTreeItem>
{
  static readonly viewType = 'shenghuabi.workflow.tree';
  #onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this.#onDidChangeTreeData.event;
  refresh() {
    this.#onDidChangeTreeData.fire(undefined);
  }
  #workspace = inject(WorkspaceService);
  async getChildren(
    element?: WorkflowTreeItem | undefined,
  ): Promise<WorkflowTreeItem[]> {
    if (!element) {
      const dir = this.#workspace.dir[FolderName.workflowDir]();
      if (!dir) {
        return [];
      }
      const fileList = await this.#workspace.rootVfs.list(dir);
      return this.#readFileList(dir, fileList);
    }
    return element.getChildren();
  }
  getTreeItem(
    element: WorkflowTreeItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  #readFileList(
    dir: string,
    fileList: string[],
    level: number = 0,
  ): Promise<WorkflowTreeItem[]> {
    return Promise.all(
      fileList
        .sort(NumberCompare)
        .map(async (item) => {
          const isDirectory = await this.#workspace.rootVfs.isDirectory(
            path.join(dir, item),
          );

          let item2;
          if (isDirectory) {
            const nextDir = path.join(dir, item);
            item2 = new WorkflowTreeItem(
              item,
              level < 2
                ? vscode.TreeItemCollapsibleState.Expanded
                : vscode.TreeItemCollapsibleState.Collapsed,
              async () => {
                const nextList = await this.#workspace.rootVfs.list(nextDir);
                return this.#readFileList(nextDir, nextList, level + 1);
              },
            );
            item2.filePath = nextDir;
            item2.isDir = true;
            item2.contextValue = 'workflow.tree.folder';
          } else {
            if (!item.endsWith('.workflow')) {
              return;
            }
            item2 = new WorkflowTreeItem(
              item.slice(0, -SUFFIX.length),
              vscode.TreeItemCollapsibleState.None,
              async () => [],
            );
            item2.filePath = path.join(dir, item);
            item2.isDir = false;
            item2.command = {
              command: 'shenghuabi.workflow.tree.file.edit',
              title: '',
              arguments: [item2.filePath],
            };
            item2.contextValue = 'workflow.tree.file';
          }
          return item2;
        })
        .filter(Boolean) as any as WorkflowTreeItem[],
    );
  }
}
