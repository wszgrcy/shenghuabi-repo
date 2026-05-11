import {
  Injector,
  RootStaticInjectOptions,
  effect,
  inject,
} from 'static-injector';
import * as vscode from 'vscode';
import { HistoryItem } from '@shenghuabi/openai';
import {
  FolderName,
  WorkspaceService,
} from '../../../service/workspace.service';
import dayjs from 'dayjs';
import { path } from '@cyia/vfs2';
import { parse } from 'yaml';
import { ChatHistoryService } from '@shenghuabi/openai';
type FileDataItem = {
  level: 1;
};
type HistoryDataItem = {
  level: 2;
  item: HistoryItem;
};
type ChatItemDataItem = {
  level: 3;
};
type ChatHistoryTreeData = FileDataItem | HistoryDataItem | ChatItemDataItem;
export class ChatHistoryTreeItem extends vscode.TreeItem {
  data;
  getChildren;
  constructor(
    override readonly label: string,
    override readonly collapsibleState: vscode.TreeItemCollapsibleState,
    data: ChatHistoryTreeData,
    getChildren: () => Promise<ChatHistoryTreeItem[]>,
  ) {
    super(label, collapsibleState);
    this.data = data;
    this.getChildren = getChildren;
  }
}
export class ChatHistoryTree
  extends RootStaticInjectOptions
  implements vscode.TreeDataProvider<ChatHistoryTreeItem>
{
  static viewId = 'shenghuabi.chat.history' as const;
  #onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this.#onDidChangeTreeData.event;
  #workspace = inject(WorkspaceService);
  #vfs = this.#workspace.rootVfs;
  #chatHistory = inject(ChatHistoryService);
  #injector = inject(Injector);

  constructor() {
    super();
    effect(() => {
      this.#chatHistory.update$$();
      this.#onDidChangeTreeData.fire(undefined);
    });
  }

  async getChildren(
    element?: ChatHistoryTreeItem | undefined,
  ): Promise<ChatHistoryTreeItem[]> {
    if (!element) {
      const dir = this.#workspace.dir[FolderName.chatHistory]();
      const list = await this.#vfs.readdir(dir).catch(() => []);
      const fileList = [];
      for (const item of list) {
        if (item.endsWith('yml') && dayjs(item.slice(0, -4)).isValid()) {
          const stat = this.#vfs.stat(path.join(dir, item));
          if ((await stat).isFile()) {
            fileList.push(item);
          }
        }
      }
      // 1级文件,2级当天 对话简介,3级具体,2级左键展开右键会到下方
      return fileList
        .map((item) => {
          return {
            fileName: item,
            date: dayjs(item.slice(0, -4)),
          };
        })
        .sort((a, b) => {
          return b.date.unix() - a.date.unix();
        })
        .map(({ fileName, date }) => {
          return new ChatHistoryTreeItem(
            date.format('YYYY-MM-DD'),
            vscode.TreeItemCollapsibleState.Collapsed,
            { level: 1 },
            async () => {
              const list: HistoryItem[] = parse(
                await this.#vfs.readFile(path.join(dir, fileName), {
                  encoding: 'utf-8',
                }),
              );
              return list.map((item) => {
                const instance = new ChatHistoryTreeItem(
                  dayjs(item.date).format('HH:mm:ss'),
                  vscode.TreeItemCollapsibleState.Collapsed,
                  { level: 2, item: item },
                  async () => {
                    return [
                      ...item.messages.map((item) => {
                        return new ChatHistoryTreeItem(
                          `${item.role}-${item.content.map((item) => (item.type === 'text' ? item.text : '[图片]')).join('')}`,
                          vscode.TreeItemCollapsibleState.None,
                          { level: 3 },
                          async () => {
                            return [];
                          },
                        );
                      }),
                    ];
                  },
                );
                instance.contextValue = 'prompt';

                return instance;
              });
            },
          );
        });
    }
    return element.getChildren();
  }
  getTreeItem(
    element: ChatHistoryTreeItem,
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
}
