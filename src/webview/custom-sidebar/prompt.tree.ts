import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { PromptService } from '../../service/ai/prompt.service';
import { ChatMode, PromptItem } from '../../share';

export class PromptTreeItem extends vscode.TreeItem {
  from?: string;
  promptData?: PromptItem;
  index?: number;
  constructor(
    public override readonly label: string,
    public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public getChildren: () => Promise<PromptTreeItem[]>,
  ) {
    super(label, collapsibleState);
  }
}
export class PromptTree
  extends RootStaticInjectOptions
  implements vscode.TreeDataProvider<PromptTreeItem>
{
  static viewId = 'shenghuabi.chat.tree' as const;
  #onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this.#onDidChangeTreeData.event;
  refresh() {
    this.#service.actionConfig.refresh();
    this.#service.chatConfig.refresh();
    this.#onDidChangeTreeData.fire(undefined);
  }
  // 加一个新建，一个右键？ 编辑。删除？
  #service = inject(PromptService);

  async getChildren(
    element?: PromptTreeItem | undefined,
  ): Promise<PromptTreeItem[]> {
    if (!element) {
      const list = [
        {
          config: this.#service.actionConfig,
          name: '选中处理',
          from: 'codeAction',
        },
        {
          config: this.#service.chatConfig,
          name: '通用对话',
          from: 'commonChat',
        },
      ].map((configItem) => {
        const codeActionItem = new PromptTreeItem(
          configItem.name,
          vscode.TreeItemCollapsibleState.Expanded,
          async () => {
            const data = await configItem.config.getList();
            return data.map((item, index) => {
              const treeItem = new PromptTreeItem(
                item.title,
                vscode.TreeItemCollapsibleState.Collapsed,
                async () => {
                  if (item.mode === ChatMode.template) {
                    return item.template!.map((item) => {
                      return new PromptTreeItem(
                        `${item.role}-${item.content.map((item) => (item.type === 'text' ? item.text : ''))}`,
                        vscode.TreeItemCollapsibleState.None,
                        async () => [],
                      );
                    });
                  } else if (item.mode === ChatMode.workflow) {
                    return [
                      new PromptTreeItem(
                        `${item.workflow?.path || '[未定义!]'}`,
                        vscode.TreeItemCollapsibleState.None,
                        async () => [],
                      ),
                    ];
                  }
                  return [];
                },
              );
              treeItem.from = configItem.from;
              treeItem.promptData = item!;
              treeItem.contextValue = 'prompt';
              treeItem.index = index;
              treeItem.command = {
                command: 'shenghuabi.chat.tree.item.edit',
                title: '',
                arguments: [treeItem],
              };
              return treeItem;
            });
          },
        );
        codeActionItem.from = configItem.from;
        // todo 改一个通用的？
        codeActionItem.contextValue = 'codeActionList';
        return codeActionItem;
      });

      return list;
    }
    return element.getChildren();
  }
  getTreeItem(
    element: PromptTreeItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  #getConfig(from: string) {
    switch (from) {
      case 'codeAction':
        return this.#service.actionConfig;
      case 'commonChat':
        return this.#service.chatConfig;
      default:
        throw new Error('对话配置来源异常');
    }
  }
  async deleteItem(from: string, index: number) {
    const config = this.#getConfig(from);
    await config.deleteItem(index);
    this.refresh();
  }
  /** 包括新增和修改
   *  注意是根据索引来的，所以不能修改
   */
  async saveItem(from: string, item: PromptItem, index?: number) {
    const config = this.#getConfig(from);
    index = await config.updateItem(item, index);
    this.refresh();
    return index;
  }
  async saveItemByTitle(from: string, item: PromptItem) {
    const config = this.#getConfig(from);
    const list = await config.getList();
    const index = list?.findIndex((oldItem) => oldItem.title === item.title);
    if (index === -1) {
      return this.saveItem(from, item);
    }
    return this.saveItem(from, item, index);
  }
}
