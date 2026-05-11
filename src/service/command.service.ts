import { inject, Injector, RootStaticInjectOptions } from 'static-injector';
import { commands, Disposable } from 'vscode';
import * as vscode from 'vscode';
import { CommandPrefix } from '../../script/metadata/const';
import { FolderName, WorkspaceService } from './workspace.service';

import { IMAGE_SUFFIX } from './const';

import { DocumentVectorService } from './vector-query/document-vector.service';
import { AiChatProvider } from '../webview/custom-sidebar/ai-chat.service';
import {
  PromptTree,
  PromptTreeItem,
} from '../webview/custom-sidebar/prompt.tree';
import { PromptService } from './ai/prompt.service';
import { ChatService } from './ai/chat.service';
import { CommandListen$ } from './command.listen';
import {
  KnowledgeTree,
  KnowledgeTreeItem,
} from '../webview/custom-sidebar/knowledge/knowledge.tree';
import { KnowledgeFileSystem } from '../webview/common-webview/knowledge.fs';
import { EnvironmentConfiguration } from '../webview/custom-webview/configurate';
import { FileMarkdownWebview } from '../webview/custom-webview/file-markdown';
import { sysJoin } from '../util/fs.util';
import { openFolder } from '../webview/tree/folder.tree';
import { WorkflowTree, WorkflowTreeItem } from '../webview/tree/workflow.tree';
import { v4, v5 } from 'uuid';
import { splitStrLine } from './language/sentence.split';
import MS from 'magic-string';
import { SentenceDiffSystem } from './language/sensitive-word/sensitive-word.diff';
import {
  EditorWorkflowService,
  EditorWorkflowType,
} from './editor-workflow.service';
import { ChatMode, deepClone, KnowledgeQueryOptions, UUID_NS } from '../share';
import { UIService } from './platform/ui.service';
import { path } from '@cyia/vfs2';
import { IdAssetReferenceWebview } from '../webview/custom-webview/id-asset-reference';
import {
  KnowledgeQueryResultItem,
  KnowledgeQueryResultTree,
} from '../webview/custom-sidebar/knowledge-query/result.tree';
import { parseDocument, ElementType } from 'htmlparser2';
import { render } from 'dom-serializer';
import { NodeWithChildren } from 'domhandler';
import { ChannelService } from './channel.service';
import * as fs from 'fs';
import { existsSync } from 'node:fs';
import { OCRService } from './external-call/ocr.service';

import { webviewAssetPath } from '../util/webview-asset-path';
import { MindEditorProvider } from '../webview/custom-editor/mind-editor2';
import { MindService } from './mind/mind.service';
import { KnowledgeGraphWebview } from '../webview/custom-webview/knowledge-graph';
import { WorkflowExecService } from '@shenghuabi/workflow';
import { KnowledgeEditWebview } from '../webview/custom-webview/knowledge-edit.webview';
import { DICT_PREFIX } from './vector/const';
import { CodeChatActionOptions } from './language/code-action.service';
import { CompletionService } from './language/completion.service';
import {
  ExternalCallOptions,
  ExternalCallService,
} from './external-call/external-call.service';
import { errorFormatByNode } from '@share/util/format/error-format-node';
import { CorrectionService } from './language/correction.service';
import { textDiffEdit } from '@share/util/string/text-diff-edit';
import { findWindow } from '@share/util/platform/find-window';
import { WorkflowEditorProvider } from '../webview/custom-editor/workflow-editor';
import { FileParserService } from '@shenghuabi/knowledge/file-parser';
import { CustomKnowledgeManagerService } from './knowledge/custom-knowledge.manager.service';
import { DictKnowledgeService } from '@shenghuabi/knowledge/knowledge';
import { KnowledgeItemType } from '../share/define/knowledge/working-knowledge';
import { LogFactoryService, LogService } from './log.service';
import { dynamicInject } from '../token';
import { isUndefined } from 'lodash-es';
import { ChatHistoryTreeItem } from '../webview/custom-sidebar/chat/chat.history.tree';
import { ExtensionConfig } from './config.service';
import { captureException } from '@sentry/node';
import { RawFileService } from './mind/raw-file.service';
import { PluginConfigWebview } from '../webview/custom-webview/plugin.webview';
import { PlatformApi } from '../platform/get-documnet';
import { WorkflowFileService } from '@shenghuabi/workflow';
type Path = string;
const COMMANDS: {
  commandId: string;
  method: (...args: any[]) => any;
  options?: CommandOptions;
}[] = [];
interface CommandOptions {
  //   extraData?: (
  //     this: CommandService,
  //     service: ExtensionService,
  //   ) => Promise<({ uri: vscode.Uri } & Record<string, any>) | undefined>;
  skipCheck?: boolean;
}
function Command(
  commandId: string,
  options?: CommandOptions,
): (...args: any[]) => any {
  return (_target: any, key: ClassMethodDecoratorContext) => {
    COMMANDS.push({ commandId, method: _target, options });
  };
}
const LineReg = /^(\n|\r\n)*(.*)?(\n|\r\n)*$/;
export class CommandService extends RootStaticInjectOptions {
  private disposables: Disposable[] = [];
  #workspace = inject(WorkspaceService);

  #fileParser$$ = dynamicInject(FileParserService);
  #injector = inject(Injector);

  init() {
    this.disposables = COMMANDS.map(({ commandId, method, options }) =>
      commands.registerCommand(
        `${CommandPrefix}.${commandId}`,
        async (...args) => {
          //   let context: WorkspaceService | undefined;
          let uri: vscode.Uri | undefined;
          const extra = undefined;
          //   if (options?.extraData) {
          //     extra = await options.extraData.bind(this)(this.#service);
          //     uri = extra?.uri;
          //   } else {
          //     uri = args[0];
          //   }
          //   // 用于文件系统非file时的跳过
          //   if (!options?.skipCheck) {
          //     if (uri instanceof vscode.Uri) {
          //       const injector = createInjector({
          //         providers: [
          //           WorkspaceService,
          //           { provide: UriFileToken, useValue: uri },
          //         ],
          //         parent: this.#injector,
          //       });
          //       const result = injector.get(WorkspaceService);
          //       if (!result.inited) {
          //         console.warn($localize`${uri.fsPath} 不在工作区`);
          //         return;
          //       }
          //       context = result;
          //     }
          //   }
          try {
            await method.bind(this)(args);
          } catch (error) {
            vscode.window.showErrorMessage(errorFormatByNode(error));
            captureException(error);
          }
        },
      ),
    );
  }

  #documentVector = inject(DocumentVectorService);
  @Command('syncArticle')
  updateArticleVector([]: []) {
    return this.#documentVector.syncDocument();
  }
  #aiChat = inject(AiChatProvider);
  @Command('call-ai-chat-sidebar')
  async callAiChatSidebar(data: any[]) {
    this.#aiChat.codeActionData$.next({
      option: data[0],
      documentChange: data[1],
    });
    vscode.commands.executeCommand(`shenghuabi.aiChat.focus`);
  }
  #completion = inject(CompletionService);
  @Command('call-ai-chat-editor')
  async callAiChatEditor(data: any[]) {
    const options = data[0] as CodeChatActionOptions;
    this.#completion.codeActionResolve(options);
  }
  @Command('chatReset')
  async chatReset(data: any[]) {
    this.#aiChat.reset$.next(true);
  }
  #promptService = inject(PromptService);
  #promptTree = inject(PromptTree);
  @Command('chat.tree.item.delete')
  async chatTreeItemDelete([data]: [PromptTreeItem]) {
    this.#promptTree.deleteItem(data.from!, data.index!);
  }

  #chatService = inject(ChatService);
  @Command('chat.tree.item.edit')
  async chatTreeItemEdit([data]: [PromptTreeItem]) {
    this.#chatService.changePrompt$.next({
      from: data.from!,
      item: data.promptData,
      type: 'edit',
    });
    this.#chatService.changedIndex = data.index;
  }
  @Command('chat.tree.item.add')
  async chatTreeItemAdd([data]: any[]) {
    this.#chatService.changePrompt$.next({
      from: data.from,
      type: 'add',
    });
    this.#chatService.changedIndex = undefined;
  }
  // 准备保存模板
  @Command('promptTemplateSave')
  async promptTemplateSave(data: any[]) {
    CommandListen$.next({ command: 'promptTemplateSave', arguments: [] });
  }
  #knowledgeTree = inject(KnowledgeTree);
  @Command('knowledge.add.default')
  async KnowledgeAddDefault(data: any[]) {
    // 创建文件夹.
  }
  #knowledgeManager$$ = dynamicInject(CustomKnowledgeManagerService);
  @Command('knowledge.delete')
  async KnowledgeDelete([data]: [KnowledgeTreeItem]) {
    await this.#knowledgeManager$$().destroy(data.data?.config.name!);
    // 销毁时关闭打开的文档
    await findWindow(async (tab) => {
      if (tab.input instanceof vscode.TabInputText) {
        if (tab.input.uri.scheme === 'knowledgeVfs') {
          if (
            path
              .normalize(tab.input.uri.fsPath)
              .startsWith(path.join(data.data!.dir, data.data!.fileName))
          ) {
            await vscode.window.tabGroups.close(tab);
            return false;
          }
        }
      }
      return false;
    });
  }
  @Command('knowledge.copyName')
  async KnowledgeCopyName([data]: [KnowledgeTreeItem]) {
    vscode.env.clipboard.writeText(data.label);
  }
  #listenImportMap = new Map<string, AbortController>();
  @Command('knowledge.tree.item.add')
  async KnowledgeTreeItemAdd([data]: [KnowledgeTreeItem]) {
    const channel = this.#injector.get(LogFactoryService).getLog('knowledge');
    const title = `导入到知识库-[${data.label}]`;
    channel.createProgress(title);
    try {
      const abort = new AbortController();
      if (data.data?.config.type !== 'dict') {
        const id = v4();
        this.#listenImportMap.set(id, abort);
        channel.setCommand([
          {
            title: `查看详情`,
            command: {
              commandName: 'external.call',
              args: [{ name: 'knowledge', method: 'channel' }],
              options: { usePrefix: true },
            },
          },
          {
            title: `停止导入`,
            command: {
              commandName: 'knowledge.stopImport',
              args: [id],
              options: { usePrefix: true },
            },
          },
        ]);
        abort.signal.onabort = () => {
          vscode.window.showInformationMessage(`准备停止`);
        };
      }

      const list = await vscode.window.showOpenDialog({
        canSelectFolders: false,
        canSelectMany: true,
        title: title,
        filters: {
          [`所有`]: ['*'],
          [`已验证支持格式`]: [
            'srt',
            'txt',
            'pptx',
            'odt',
            'odp',
            'ods',
            'pdf',
            'csv',
            'docx',
            'epub',
            'md',
            'yml',
            'yaml',
            'json',
            'xlsx',
            ...IMAGE_SUFFIX,
          ],
          [`图片`]: IMAGE_SUFFIX,
        },
      });
      if (!list) {
        return;
      }
      await this.#knowledgeManager$$().importFiles(
        data.data?.config.name!,
        list.map((uri) => path.normalize(uri.fsPath)),
        abort.signal,
      );

      this.#knowledgeTree.refresh();
    } finally {
      channel.endProgress();
    }
  }
  @Command('knowledge.tree.item.edit')
  async KnowledgeTreeItemEdit([data]: [KnowledgeTreeItem]) {
    const filePath = path.join(data.data!.dir, data.data!.fileName);
    vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.file(filePath).with({
        scheme: KnowledgeFileSystem.scheme,
        query: data.data!.config.name,
      }),
      { selection: data.selection, preview: false },
    );
  }
  @Command('knowledge.tree.item.delete')
  async KnowledgeTreeItemDelete([data]: [KnowledgeTreeItem]) {
    // 按的速度过快会出现异常,重构时可以考虑改成通用的检查
    if (!data) {
      return;
    }
    await this.#knowledgeManager$$().deleteItem(
      data.data!.config.name,
      data.data!.fileName,
    );
    this.#knowledgeTree.refresh();
    await findWindow(async (tab) => {
      if (tab.input instanceof vscode.TabInputText) {
        if (tab.input.uri.scheme === 'knowledgeVfs') {
          if (
            path
              .normalize(tab.input.uri.fsPath)
              .startsWith(path.join(data.data!.dir, data.data!.fileName))
          ) {
            await vscode.window.tabGroups.close(tab);
            return true;
          }
        }
      }
      return false;
    });
  }
  #environmentConfiguration = inject(EnvironmentConfiguration);
  #fileMarkdown = inject(FileMarkdownWebview);

  @Command('open-environment-configuration')
  async OpenConfiguration([]: any[]) {
    return this.#environmentConfiguration.open();
  }
  @Command('help')
  async OpenHelp([]: any[]) {
    this.#fileMarkdown.open(
      '帮助',
      sysJoin(__dirname, 'data/document/help.md'),
    );
  }
  @Command('open-folder')
  async openFolderCommand([key, item]: [FolderName, any]) {
    const dir = await this.#workspace.dir[key]();
    if (!dir) {
      return;
    }
    if (item.isFile) {
      openFolder(path.dirname(dir));
    } else {
      openFolder(dir);
    }
  }
  #workflowTree = inject(WorkflowTree);
  @Command('workflow.tree.file.delete')
  async workflowFileDelete([key]: [WorkflowTreeItem]) {
    await findWindow(async (tab) => {
      if (
        tab.input instanceof vscode.TabInputCustom &&
        tab.input.viewType === WorkflowEditorProvider.viewType &&
        path.normalize(tab.input.uri.fsPath) === path.normalize(key.filePath)
      ) {
        await vscode.window.tabGroups.close(tab);
        return true;
      }
      return false;
    });
    await this.#workflowFile.remove(key.filePath);
    await this.#workspace.rootVfs.delete(key.filePath);

    this.#workflowTree.refresh();
  }
  #ui = inject(UIService);
  @Command('workflow.tree.file.rename')
  async workflowFileRename([key]: [WorkflowTreeItem]) {
    const result = await this.#ui.rename(key.filePath, undefined, '重命名');
    if (result) {
      this.#workflowTree.refresh();
    }
  }
  @Command('workflow.tree.file.copy')
  async workflowFileCopy([key]: [WorkflowTreeItem]) {
    const newName = await this.#ui.inputBox(
      this.#workspace.getWorkflowName(key.filePath),
      `请输入新的工作流名字`,
    );
    if (!newName) {
      return;
    }
    const data = await this.#workspace.rootVfs.read(key.filePath);
    await this.#workspace.rootVfs.write(
      this.#workspace.joinWorkflowName(newName),
      new Uint8Array(data),
    );
    this.#workflowTree.refresh();
  }
  @Command('workflow.tree.file.edit')
  async workflowFileEdit([key]: [Path]) {
    const data = vscode.Uri.file(key);
    vscode.commands.executeCommand('vscode.open', data);
  }
  @Command('workflow.tree.file.add')
  async workflowFileNew([key]: [WorkflowTreeItem]) {
    const dir = key?.isDir
      ? key.filePath
      : this.#workspace.dir[FolderName.workflowDir]();

    if (!dir) {
      return;
    }

    const defaultName = `未命名-${v4().slice(0, 5)}`;
    const value = await vscode.window.showInputBox({
      title: `[${dir}]请输入工作流名称`,
      value: defaultName,
    });
    if (!value) {
      return;
    }
    const nDir = dir;
    const filePath = path.join(nDir, value + '.workflow');
    if (await this.#workspace.rootVfs.exists(filePath)) {
      vscode.window.showWarningMessage(`文件已存在`);
      return;
    }

    await this.#workspace.rootVfs.write(filePath, []);
    this.#workflowTree.refresh();

    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
  }
  @Command('workflow.tree.folder.open')
  async workflowFolderOpen([key]: [WorkflowTreeItem]) {
    const dir = key?.isDir
      ? key.filePath
      : this.#workspace.dir[FolderName.workflowDir]();
    openFolder(dir);
  }
  #workflowExec = inject(WorkflowExecService);
  #sensitiveWordDiff = inject(SentenceDiffSystem);

  #editorWorkflowService = inject(EditorWorkflowService);
  #platformApi = inject(PlatformApi);
  async #editorWorkflowChange(
    uri: vscode.Uri,
    type: EditorWorkflowType,
    force: boolean,
    channel: LogService,
  ) {
    const content = await this.#platformApi.getDocument(uri);
    if (!content) {
      return;
    }
    const result = await this.#editorWorkflowService.workflowConfigSet(
      type,
      force,
    );
    if (!result) {
      return;
    }
    const workflow = await this.#editorWorkflowService.getWorkflow(type);
    if (!workflow) {
      return;
    }
    const ms = new MS(content);
    const editor = vscode.window.activeTextEditor;

    if (type === 'sentence') {
      const list = splitStrLine(content!);
      const newList = [];
      for (let index = 0; index < list.length; index++) {
        channel.info(`${index}/${list.length}`);
        const sentenceItem = list[index];
        const defaultInput: Record<string, any> = {
          line: sentenceItem.content,
        };
        const result = await this.#workflowExec.exec(
          workflow,
          {
            input: {},
            environmentParameters: defaultInput,
          },
          { showError: true },
          await channel.activeProgress,
        );
        const resultContent = ((result.value ?? '') as string).replace(
          LineReg,
          `$2`,
        );
        if (sentenceItem.start !== sentenceItem.end) {
          ms.update(sentenceItem.start, sentenceItem.end, resultContent);
        } else if (resultContent) {
          ms.appendRight(sentenceItem.start, resultContent);
        }
        newList.push({ ...sentenceItem, newContent: resultContent });
      }

      if (ExtensionConfig['sentence.displayMode']() === 'hover') {
        return this.#correction.setHover(
          editor!,
          newList.flatMap((item) => {
            return [...textDiffEdit(item.content, item.newContent)].map(
              (diffItem) => {
                return {
                  ...diffItem[1],
                  id: v4(),
                  start: item.start + diffItem[0],
                  end: item.start + diffItem[0] + diffItem[1].oldValue.length,
                };
              },
            );
          }),
          'sentence',
        );
      }
    } else {
      // 传入的内容
      const defaultInput: Record<string, any> = {
        content: content,
      };
      const result = await this.#workflowExec.exec(
        workflow,
        {
          input: {},
          environmentParameters: defaultInput,
        },
        { showError: true },
        await channel.activeProgress,
      );
      const resultContent = ((result.value ?? '') as string).replace(
        LineReg,
        `$2`,
      );

      ms.update(0, content.length, resultContent);
    }
    const workflowName = this.#editorWorkflowService.getWorkflowPath(type);
    this.#sensitiveWordDiff.openDiff(uri, ms.toString(), workflowName);
  }
  @Command('editor.sentence.change')
  async sentenceChange([uri]: [vscode.Uri]) {
    const channel = this.#injector.get(LogFactoryService).getLog('workflow');
    channel.createProgress('逐行处理中');
    try {
      await this.#editorWorkflowChange(uri, 'sentence', false, channel);
    } finally {
      channel.endProgress();
    }
  }
  @Command('editor.sentence.re-change')
  async sentenceReChange([uri]: [vscode.Uri]) {
    const channel = this.#injector.get(LogFactoryService).getLog('workflow');
    channel.createProgress('逐行处理中');
    try {
      await this.#editorWorkflowChange(uri, 'sentence', true, channel);
    } finally {
      channel.endProgress();
    }
  }
  @Command('editor.fullText.change')
  async fullTextChange([uri]: [vscode.Uri]) {
    const channel = this.#injector.get(LogFactoryService).getLog('workflow');
    channel.createProgress('全文处理中');
    try {
      await this.#editorWorkflowChange(uri, 'fullText', false, channel);
    } finally {
      channel.endProgress();
    }
  }
  @Command('editor.fullText.re-change')
  async fullTextReChange([uri]: [vscode.Uri]) {
    const channel = this.#injector.get(LogFactoryService).getLog('workflow');
    channel.createProgress('全文处理中');
    try {
      await this.#editorWorkflowChange(uri, 'fullText', true, channel);
    } finally {
      channel.endProgress();
    }
  }
  @Command('editor.diff.saveAs')
  async diffSaveAs([uri, data]: [vscode.Uri, { groupId: number }]) {
    const tab = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
    if (tab instanceof vscode.TabInputTextDiff) {
      const saveName = await this.getSaveRename(tab.original);
      if (!saveName) {
        return;
      }
      const result = (await this.#platformApi.getDocument(tab.original))!;
      const dirName = path.dirname(tab.modified.fsPath);
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(path.join(dirName, saveName)),
        new Uint8Array(Buffer.from(result)),
      );
      // 保存后还需要关闭
    }
  }
  async getSaveRename(uri: vscode.Uri) {
    const baseName = path.basename(uri.fsPath);
    const result = await vscode.window.showInputBox({
      title: `设置左侧编辑器保存重命名`,
      value: baseName.slice(0, -37),
    });
    return result;
  }
  @Command('external.document-convert')
  /** 文档转换 */
  async ExternalDocumentConvert([uri]: [vscode.Uri]) {
    const channel = this.#injector.get(LogFactoryService).getLog('system');
    channel.createProgress('文档转换处理中');
    try {
      const result = await this.#fileParser$$().parseOne(
        uri.fsPath,
        new Uint8Array(await this.#workspace.vfs.read(uri.fsPath)),
      );
      if (!result.content) {
        return;
      }
      const dirName = path.dirname(uri.fsPath);
      const baseName = path.basename(uri.fsPath, path.extname(uri.fsPath));
      const suffix = result.parseTo === 'markdown' ? '.md' : '';
      await this.#workspace.vfs.write(
        path.join(dirName, `${baseName}-转换${suffix}`),
        result.content,
      );
    } finally {
      channel.endProgress();
    }
  }
  #idAssetRef = inject(IdAssetReferenceWebview);
  @Command(`knowledge-query.open-dict-item`)
  async openDictItem([data, dict]: [any, KnowledgeItemType]) {
    // content被改变导致多次会不断累加
    data = deepClone(data);
    const dictName = (dict.name as string).slice(DICT_PREFIX.length);
    const title = `${dictName}:${data.word}`;
    const id = v5(title, UUID_NS);
    const content = data['htmlContent'] ?? data['content'];
    const document = parseDocument(content);
    const dictDir = path.join(
      this.#workspace.dir[FolderName.knowledgeDir](),
      dict.name,
      'assets',
    );
    this.#visitAll(document, dictDir, dictName);
    data['content'] = render(document);

    this.#idAssetRef.assetMap.set(id, {
      data,
      type: 'dict',
    });
    this.#idAssetRef.open(title, id, {
      viewColumn: vscode.ViewColumn.Active,
      assets: [
        vscode.Uri.file(this.#workspace.dir[FolderName.knowledgeDir]()),
        vscode.Uri.file(dictDir),
      ],
    });
  }
  @Command(`knowledge-query.open-dict-item-anchor`)
  async openDictItemAnchor([dictName, wordName]: [string, string]) {
    const title = `${dictName}:${wordName}`;
    const id = v5(title, UUID_NS);
    const collectionName = `${DICT_PREFIX}${dictName}`;
    const instance = (await this.#knowledgeManager$$().get(
      collectionName,
    )) as DictKnowledgeService;
    const { points } = await instance.matchWord(wordName, { limit: 1 });

    const payload = points[0].payload! as any;
    const content = payload['htmlContent'] ?? (payload['content'] as string);
    const document = parseDocument(content);
    const dictDir = path.join(
      this.#workspace.dir[FolderName.knowledgeDir](),
      collectionName as string,
      'assets',
    );
    this.#visitAll(document, dictDir, dictName);
    payload['content'] = render(document);

    this.#idAssetRef.assetMap.set(id, {
      data: payload,
      type: 'dict',
    });
    this.#idAssetRef.open(title, id, {
      viewColumn: vscode.ViewColumn.Active,
      assets: [
        vscode.Uri.file(this.#workspace.dir[FolderName.knowledgeDir]()),
        vscode.Uri.file(dictDir),
      ],
    });
  }
  #visitAll(el: NodeWithChildren, baseUrl: Path, dictName: string) {
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i];
      if (child.type === ElementType.Tag) {
        if (child.name === 'a') {
          const href = (child.attribs['href'] as string)?.slice(8);
          if (!href) {
            return;
          }
          child.attribs['data-command'] =
            `${CommandPrefix}.knowledge-query.open-dict-item-anchor`;
          child.attribs['data-arg0'] = `${dictName}`;
          child.attribs['data-arg1'] = `${href}`;
          child.attribs['is'] = 'command-wrapper';
        } else if (child.name === 'link') {
          child.attribs['href'] = webviewAssetPath(
            path.join(baseUrl, child.attribs['href']),
          );
        } else if (child.name === 'img') {
          child.attribs['src'] = webviewAssetPath(
            path.join(baseUrl, child.attribs['src']),
          );
        } else if (child.children.length) {
          this.#visitAll(child, baseUrl, dictName);
        }
      } else if ((child as any)?.['children']?.length) {
        this.#visitAll(child as any, baseUrl, dictName);
      }
    }
  }

  #resultTree = inject(KnowledgeQueryResultTree);
  @Command(`knowledge-query.search`)
  async knowledgeQuery([data, replaceValue]: [
    KnowledgeQueryOptions,
    (value: string) => Promise<boolean>,
  ]) {
    this.#resultTree.queryKnowledge(data, true, replaceValue);
  }
  @Command(`knowledge-query.replace`)
  async knowledgeQueryReplace([data]: [KnowledgeQueryResultItem]) {
    data.replaceFn!();
  }

  #channel = inject(ChannelService);
  @Command(`showChannel`)
  async showChannel([value]: [string]) {
    this.#channel.show(value);
  }
  @Command(`chatTemplateSync`)
  async chatTemplateSync() {
    for (const { filePath, title, savePath } of [
      {
        filePath: `{{extensionFolder}}/data/prompt/selection_prompt.yml`,
        title: `[模板同步]-选中处理`,
        savePath: this.#workspace.dir[FolderName.selectionPromptDir](),
      },
      {
        filePath: `{{extensionFolder}}/data/prompt/common_prompt.yml`,
        title: `[模板同步]-通用对话`,
        savePath: this.#workspace.dir[FolderName.commonPromptDir](),
      },
    ]) {
      const presetPath = this.#workspace.formatPath(filePath);
      if (existsSync(savePath)) {
        if (presetPath !== savePath) {
          await vscode.commands.executeCommand(
            `vscode.diff`,
            vscode.Uri.file(presetPath),
            vscode.Uri.file(savePath),
            title,
            { preview: false } as vscode.TextDocumentShowOptions,
          );
        }
      } else {
        await fs.promises.cp(presetPath, savePath);
      }
    }

    this.#promptTree.refresh();
  }
  #workflowFile = inject(WorkflowFileService);
  @Command(`workflowSync`)
  async workflowSync() {
    // 工作流复制
    const data = this.#workspace.formatPath(
      `{{extensionFolder}}/data/workflow/default`,
    );
    const dir = sysJoin(
      this.#workspace.dir[FolderName.workflowDir](),
      'default',
    );
    await findWindow(async (tab) => {
      if (tab.input instanceof vscode.TabInputCustom) {
        if (tab.input.uri.path.endsWith('.workflow')) {
          if (
            path.normalize(tab.input.uri.fsPath).startsWith(path.normalize(dir))
          ) {
            await vscode.window.tabGroups.close(tab);
            return false;
          }
        }
      }
      return false;
    });
    await this.#workflowFile.closeDefulatFile();
    await vscode.workspace.fs.copy(
      vscode.Uri.file(data),
      vscode.Uri.file(dir),
      { overwrite: true },
    );
    this.#workflowTree.refresh();
    vscode.window.showInformationMessage(`工作流同步成功`);
  }
  #ocr = inject(OCRService);
  @Command(`external.image-convert`)
  async imageConvert([uri]: [vscode.Uri]) {
    const channel = this.#injector.get(LogFactoryService).getLog('ocr');
    channel.createProgress('图像识别中');

    try {
      const result = await this.#ocr.autoConvert(uri.fsPath);
      if (isUndefined(result)) {
        channel.warn('未安装OCR');
        return;
      }
      const dirName = path.dirname(uri.fsPath);
      const baseName = path.basename(uri.fsPath, path.extname(uri.fsPath));
      await this.#workspace.vfs.write(
        path.join(dirName, baseName + '-识别'),
        result,
      );
    } finally {
      channel.endProgress();
    }
  }

  #correction = inject(CorrectionService);

  #mindEditor = inject(MindEditorProvider);
  @Command(`mind.focus-node`)
  async mindJumpNode([uri, nodeId]: [string, string]) {
    this.#mindEditor.focusNode(uri, nodeId);
  }
  #mindService = inject(MindService);
  @Command(`mind.theme.create`)
  async mindThemeCreate([options]: [any]) {
    const fileName = await this.#ui.inputBox(
      `[${options.type}][${options.kind}]-未命名`,
      `创建主题`,
    );
    if (!fileName) {
      return;
    }
    const filePath = await this.#mindService.createNewTheme({
      ...options,
      fileName,
    });
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filePath));
  }
  #knowledgeGraph = inject(KnowledgeGraphWebview);
  @Command(`knowledge.graph.open`)
  async knowledgeGraphOpen([data]: [any]) {
    this.#knowledgeGraph.open(`[图谱]${data.fileName}`, data.fileName);
  }
  @Command(`knowledge.stopImport`)
  async knowledgeStopImport([id]: [string]) {
    this.#listenImportMap.get(id)?.abort();
    this.#listenImportMap.delete(id);
  }
  @Command(`knowledge.tree.item.export`)
  async knowledgeExport([data]: [KnowledgeTreeItem]) {
    const channel = this.#injector.get(LogFactoryService).getLog('knowledge');
    channel.createProgress('导出知识库');
    try {
      await this.#knowledgeManager$$().export2(data.data!.config.name);
    } finally {
      channel.endProgress();
    }
  }
  @Command(`knowledge.tree.import`)
  async knowledgeImport() {
    const channel = this.#injector.get(LogFactoryService).getLog('knowledge');
    channel.createProgress('导入知识库');
    try {
      await this.#knowledgeManager$$().import2();
    } finally {
      channel.endProgress();
    }
  }
  @Command(`knowledge.tree.item.configEdit`)
  async knowledgeEdit([data]: [KnowledgeTreeItem]) {
    const name = data.data?.config.name;
    if (!name) {
      return;
    }
    this.#injector.get(KnowledgeEditWebview).open(name, v5(name, UUID_NS), {
      name: name,
      fileName: data.data?.fileName,
      dir: data.data?.dir,
    });
  }
  #externalCall = inject(ExternalCallService);
  @Command(`external.call`)
  async externalCall([input]: [ExternalCallOptions]) {
    this.#externalCall.call(input);
  }
  @Command(`knowledge.tree.openFolder`)
  async KnowledgeOpenFolder([input]: [any]) {
    const dir = this.#workspace.dir[FolderName.knowledgeDir]();
    openFolder(dir);
  }
  @Command(`completion.select`)
  async CompletionSelect([input]: [any]) {
    this.#completion.listSelect.next(input);
  }
  @Command(`correction.updateItem`)
  async correctionUpdateItem([input]: [{ id: string; documentId: string }]) {
    this.#correction.changeItem(input);
  }
  @Command(`correction.clear`)
  async correctionClear([input]: [{ id: string; documentId: string }]) {
    if (vscode.window.activeTextEditor) {
      this.#correction.clear(vscode.window.activeTextEditor);
    }
  }
  @Command(`chat.history.use`)
  async chatHistoryUse([input]: [ChatHistoryTreeItem]) {
    if (input.data.level !== 2) {
      return;
    }
    this.#chatService.changePrompt$.next({
      from: 'history',
      item: {
        title: '',
        mode: ChatMode.default,
        template: input.data.item.messages,
      },
      type: 'edit',
    });
  }
  @Command(`chat.history.openFolder`)
  async chatHistoryOpen([input]: [ChatHistoryTreeItem]) {
    const dir = this.#workspace.dir[FolderName.chatHistory]();
    openFolder(dir);
  }

  async #tts(uri: vscode.Uri, force: boolean) {
    const channel = this.#injector.get(LogFactoryService).getLog('workflow');
    channel.createProgress('文本解析为tts配置');
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const content = editor.document.getText();
      const fileData = this.#workspace.getRelFilePath2(uri.fsPath);
      const defaultInput: Record<string, any> = {
        fullPath: path.normalize(uri.fsPath),
        relFilePath: fileData.relFilePath,
        dir: fileData.dir,
        content,
      };
      const setResult = await this.#editorWorkflowService.workflowConfigSet(
        'tts',
        force,
      );
      if (!setResult) {
        return;
      }
      const workflow = await this.#editorWorkflowService.getWorkflow('tts');
      if (!workflow) {
        return;
      }
      const result = await this.#workflowExec.exec(
        workflow,
        {
          input: {},
          environmentParameters: defaultInput,
        },
        { showError: true },
        await channel.activeProgress,
      );
      const fileService = this.#injector.get(RawFileService);

      const nFilePath =
        (fileData.dir === this.#workspace.nFolder()
          ? path.normalize(uri.fsPath)
          : path.join(
              this.#workspace.nFolder() ?? fileData.dir,
              fileData.relFilePath,
            )
        ).replace(/\.\w+$/, '') + '.tts';
      const rawFile = fileService.getFile(nFilePath);
      await rawFile.save(result.value);
      const openUri = vscode.Uri.file(nFilePath);
      vscode.commands.executeCommand('vscode.open', openUri);
    } finally {
      channel.endProgress();
    }
  }
  @Command(`tts.editor`)
  async ttsLineSplit([uri]: [vscode.Uri]) {
    return this.#tts(uri, false);
  }
  @Command(`tts.editor.force`)
  async ttsLineSplit2([uri]: [vscode.Uri]) {
    return this.#tts(uri, true);
  }
  @Command(`pluginConfig.open`)
  async pluginConfigOpen([packageJson, definePath]: [
    Record<string, any>,
    string,
  ]) {
    return this.#injector
      .get(PluginConfigWebview)
      .open(
        packageJson['displayName'] ?? packageJson['name'],
        packageJson['name'],
        { packageJson, definePath },
      );
  }
}

/**
 * 修改后的内容放左,但是允许编辑。保存时应该改名，并且关闭这个diff
 *
 */
