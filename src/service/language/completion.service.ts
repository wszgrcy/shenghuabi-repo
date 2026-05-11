import * as vscode from 'vscode';
import { Hanyu } from './const';
import { inject, RootStaticInjectOptions } from 'static-injector';
import { InlineChatService } from './inline-chat.service';
import { PromptService } from '../ai/prompt.service';
import { ChatService } from '../ai/chat.service';
import {
  AssistantChatMessageType,
  ChatMessageListInputType,
  ChatMode,
  deepClone,
} from '../../share';
import { WorkflowExecService, ResolvedWorkflow } from '@shenghuabi/workflow';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import { filter, Subject, Subscription, take } from 'rxjs';
import {
  isChatStream,
  LLMWorkflowData,
  WorkflowStreamData,
} from '@shenghuabi/workflow';
import { KnowledgeFileSystem } from '../../webview/common-webview/knowledge.fs';
import { FolderName, WorkspaceService } from '../workspace.service';
import { path } from '@cyia/vfs2';
import { CodeChatActionOptions } from './code-action.service';
import { TemplateFormatService } from '@shenghuabi/workflow';
import { han2numberReChange } from '@shenghuabi/han2number';
import { NumberCompare } from '../../util/number-compare';
import { ExtensionConfig } from '../config.service';
import { getNumberText } from '@share/util/format/get-number-text';
import { isStringArray } from '@share/util/assert/is-string-array';
import { CommandPrefix } from '@global';
import { captureException } from '@sentry/node';
function isEditorData(
  location: vscode.ChatRequest['location2'],
): location is vscode.ChatRequestEditorData {
  return location instanceof vscode.ChatRequestEditorData;
}
interface InlineEditorData {
  mode: ChatMode;
  manualInput: boolean;
  input: {
    selection: string;
  };
  resolvedWorkflow?: ResolvedWorkflow;
  template?: ChatMessageListInputType;
}
export class CompletionService extends RootStaticInjectOptions {
  #inlineChat = inject(InlineChatService);
  #promptService = inject(PromptService);
  #chatService = inject(ChatService);
  #workflowExec = inject(WorkflowExecService);
  #workflow = inject(WorkflowSelectService);
  #workspace = inject(WorkspaceService);
  #selectedEditorTemplate = new Map<string, InlineEditorData>();
  listSelect = new Subject<{ filePath: string; value: string }>();
  #selectSubscriptionMap = new Map<string, Subscription>();
  init() {
    vscode.languages.registerInlineCompletionItemProvider(Hanyu, {
      provideInlineCompletionItems: async (doc, pos, context, token) => {
        //todo 使用命令时进行补全
        return null;
      },
    });
    const list = ExtensionConfig.chatModelList();
    const modelObject = {} as Record<string, NonNullable<typeof list>[number]>;

    const providerList: vscode.LanguageModelChatInformation[] = [];
    if (list?.length) {
      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        modelObject[item.name] = item;
        providerList.push({
          id: 'shenghuabi',
          name: item.name,
          family: 'custom',
          version: '1.0',
          maxInputTokens: 99999999,
          maxOutputTokens: 99999999,
          isDefault: index === 0,
          isUserSelectable: true,
        });
      }
    } else {
      providerList.push({
        id: 'shenghuabi',
        name: 'shenghuabi',
        family: 'inline',
        version: '1.0',
        maxInputTokens: 99999999,
        maxOutputTokens: 99999999,
        isDefault: true,
        isUserSelectable: true,
      });
    }
    this.#inlineChat.modelList = providerList;
    if (list?.length) {
      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        modelObject[item.name] = item;
        vscode.lm.registerChatModelProvider(item.name, this.#inlineChat);
      }
    } else {
      vscode.lm.registerChatModelProvider('shenghuabi', this.#inlineChat);
    }
    const chatHistory = new Map<string, ChatMessageListInputType>();
    vscode.chat.createChatParticipant(
      'shenghuabi.chat.editor',
      async (req, context, stream, token) => {
        // token只能监听到取消,不能监听到关闭
        const modelOptions =
          req.model.family === 'custom' ? modelObject[req.model.id] : undefined;
        const abort = new AbortController();
        token.onCancellationRequested(() => abort.abort());
        const { location2 } = req;
        if (!isEditorData(location2)) {
          return;
        }
        const filePath = location2.document.uri.fsPath;
        // 优先常规对话
        if (context.history.length > 0) {
          const list = chatHistory.get(filePath);
          const llm = await this.#chatService.chat(modelOptions);
          const messages = [
            ...list!,
            { role: 'user', content: [{ type: 'text', text: req.prompt }] },
          ] as ChatMessageListInputType;
          const result = llm.stream(
            {
              messages: messages,
            },
            { signal: abort.signal },
          );
          let lastResult;

          for await (const item of result) {
            lastResult = item;
            stream.markdown(item.delta);
          }

          chatHistory.set(filePath, [
            ...messages,
            {
              role: 'assistant' as const,
              content: [
                {
                  type: 'text',
                  text: lastResult!.content,
                },
              ],
              thinkContent: lastResult!.thinkContent,
            } as AssistantChatMessageType,
          ]);

          stream.textEdit(location2.document.uri, [
            new vscode.TextEdit(location2.selection, lastResult!.content),
          ]);
          return;
        }
        const inlineEditorData = this.#selectedEditorTemplate.get(filePath)!;
        const dirName = path.dirname(location2.document.uri.fsPath);
        // 无工作区的情况下,应该没有文件列表
        const dirFileList = this.#workspace.nFolder()
          ? await this.#workspace.vfs.list(dirName)
          : [];
        const baseName = path.basename(location2.document.uri.fsPath);

        let lastMessage: WorkflowStreamData;
        let lastId: string | undefined;
        let thinkProgressStatus;
        const thinkEnd = Promise.withResolvers<void>();
        let lastThinkStatus = false;
        const streamFn = (message: WorkflowStreamData) => {
          const isChat = isChatStream(message);
          // 对话类型
          if (isChat) {
            const item = message as LLMWorkflowData;
            if (lastId && item.node.id !== lastId) {
              stream.markdown('\n\n');
            }
            if (item.extra.isThinking && !thinkProgressStatus!) {
              thinkProgressStatus = true;
              stream.progress('思考中', (p) => {
                return thinkEnd.promise;
              });
            }
            if (item.extra.isThinking) {
              stream.markdown(item.extra.delta!);
            } else if (lastThinkStatus === true && !item.extra.isThinking) {
              stream.markdown('\n\n');
              stream.markdown('---');
              stream.markdown('\n\n');
              stream.markdown(item.extra.delta!);
            } else {
              stream.markdown(item.extra.delta!);
            }
            lastId = message.node.id;
            // todo 思考应该独立?
            chatHistory.set(filePath, item.extra.historyList!);
            lastMessage = message;
            lastThinkStatus = !!item.extra.isThinking;
          }
        };
        const input = deepClone(inlineEditorData.input) as Record<string, any>;
        if (inlineEditorData.manualInput) {
          input['input'] = req.prompt;
        }
        const defaultInput = this.#createDefaultInput(
          input,
          location2.document,
          location2.selection,
          dirName,
          baseName,
          dirFileList,
        );

        let result;
        // 两种,一种是工作流,一种是上下文
        if (inlineEditorData.mode === ChatMode.workflow) {
          const subject = new Subject<WorkflowStreamData>();
          subject.subscribe(streamFn);
          result = await this.#workflowExec
            .runParse(
              inlineEditorData.resolvedWorkflow!,
              {
                input: {},
                modelOptions: modelOptions,
                environmentParameters: defaultInput,
              },
              subject,
              abort.signal,
            )
            .catch((rej) => {
              captureException(rej);
              throw rej;
            });
        } else {
          result = await this.#workflowExec
            .agentChat(
              {
                template: inlineEditorData.template!,
                input: {},
                context: {},
                modelOptions: modelOptions,
                environmentParameters: defaultInput,
                inlineMode: true,
              },

              streamFn,
              abort.signal,
            )
            .catch((rej) => {
              captureException(rej);
              throw rej;
            });
        }
        if (typeof result?.value === 'string') {
          stream.textEdit(location2.document.uri, [
            new vscode.TextEdit(location2.selection, result.value),
          ]);
        } else if (isStringArray(result?.value)) {
          this.#createCompletionListSelect(result?.value, stream, location2);
        }
        if (!lastMessage!) {
          return;
        }
        thinkEnd.resolve();
        const knowledgeDir = this.#workspace.dir[FolderName.knowledgeDir]();
        if (isChatStream(lastMessage)) {
          for (const item of lastMessage!.extra.references ?? []) {
            if (item.reference) {
              if (item.reference.type === 'knowledge') {
                const selection = new vscode.Selection(
                  new vscode.Position(item.reference.loc!.lines.from - 1, 0),
                  new vscode.Position(item.reference.loc!.lines.to, 0),
                );
                const local = new vscode.Location(
                  vscode.Uri.file(
                    path.join(
                      knowledgeDir,
                      item.reference.knowledgeName,
                      item.reference.fileName,
                    ),
                  ).with({
                    scheme: KnowledgeFileSystem.scheme,
                    query: item.reference.knowledgeName,
                  }),
                  selection,
                );
                stream.reference2(local, new vscode.ThemeIcon('book'), {
                  status: {
                    description: item.tooltip || item.description,
                    kind: vscode.ChatResponseReferencePartStatusKind.Partial,
                  },
                });
              } else if (item.reference.type === 'card') {
                const local = vscode.Uri.file(item.reference.fileName);
                stream.reference2(local, undefined, {
                  status: {
                    description: item.tooltip || item.description,
                    kind: vscode.ChatResponseReferencePartStatusKind.Partial,
                  },
                });
              }
            }
          }
        }
      },
    );
  }
  /** 多选 */
  #createCompletionListSelect(
    list: string[],
    stream: vscode.ChatResponseStream,
    location2: vscode.ChatRequestEditorData,
  ) {
    for (const item of list) {
      stream.button({
        title: item,
        command: `${CommandPrefix}.completion.select`,
        arguments: [{ filePath: location2.document.uri.fsPath, value: item }],
      });
      // stream.markdown(item);
    }
    this.#selectSubscriptionMap
      .get(location2.document.uri.fsPath)
      ?.unsubscribe();
    // todo 只支持一次,是不是不太好?
    // 或者选完了直接关闭,或者不关闭继续选
    this.#selectSubscriptionMap.set(
      location2.document.uri.fsPath,
      this.listSelect
        .pipe(
          take(1),
          filter((item) => !!item.filePath),
        )
        .subscribe(({ value }) => {
          const workspaceEdit = new vscode.WorkspaceEdit();
          workspaceEdit.replace(
            location2.document.uri,
            location2.selection,
            value,
          );
          vscode.workspace.applyEdit(workspaceEdit);
        }),
    );
  }
  #templateFormat = inject(TemplateFormatService);
  async codeActionResolve(options: CodeChatActionOptions) {
    const list = await this.#promptService.actionConfig.getList();
    const actionItem = list.find((item) => item.title === options.title)!;
    let manualInput = false;
    let data: Partial<InlineEditorData>;
    const selection = options.document.getText(options.range);
    if (actionItem.mode === ChatMode.workflow) {
      const workflowData = await this.#workflow.get({
        workflowName: actionItem.workflow!.path!,
      });
      const result = this.#workflowExec.parse(workflowData);
      if (result.error) {
        throw result.error;
      }
      manualInput = !!result.manualInput;
      data = {
        resolvedWorkflow: result.data,
      };
    } else {
      const { error, list } = this.#templateFormat.parse(
        actionItem.template!.map((item) => item.content).join('\n'),
      );
      if (error) {
        throw new Error('模板解析失败');
      }
      manualInput = list.some((item) => item.value === 'input');

      data = {
        template: actionItem.template!,
      };
    }
    this.#selectedEditorTemplate.set(options.filePath, {
      ...data,
      mode: actionItem.mode,
      manualInput,
      input: {
        selection: selection,
      },
    });
    const range = options.range;
    vscode.commands.executeCommand(`vscode.editorChat.start`, {
      position: range.start,
      initialSelection: new vscode.Selection(range.start, range.end),
      initialRange: range,
      autoSend: !manualInput,
      message: '/default ',
    });
  }
  // #workspace = inject(WorkspaceService);
  #getOffset(name: string, prefix: string) {
    if (name.startsWith(prefix)) {
      const str = name.slice(prefix.length);
      const result = str.match(/^\d+$/);
      if (result) {
        return +result[0];
      }
    }
    return;
  }
  #getLastLinePosition(
    document: vscode.TextDocument,
    endPosition: vscode.Position,
  ) {
    const offset = document.offsetAt(endPosition);
    const nextPosition = new vscode.Position(
      endPosition.line,
      endPosition.character + 1,
    );

    return document.positionAt(
      document.offsetAt(nextPosition) === offset ? offset : offset - 1,
    );
  }
  #getDynamic(
    key: string,
    document: vscode.TextDocument,
    selection: vscode.Selection,
    dirName: string,
    baseName: string,
    dirFileList: string[],
  ) {
    // 当前文件
    if (key === 'currentFile') {
      return document.getText();
    } else if (key === 'selectionLine') {
      return document.getText(
        new vscode.Range(
          new vscode.Position(selection.start.line, 0),
          this.#getLastLinePosition(
            document,
            new vscode.Position(selection.end.line + 1, 0),
          ),
        ),
      );
    }

    // 前x行
    const linesOffset = this.#getOffset(key, 'topLines');
    if (linesOffset) {
      return document.getText(
        new vscode.Range(
          new vscode.Position(
            Math.max(0, selection.start.line - linesOffset),
            0,
          ),
          this.#getLastLinePosition(
            document,
            new vscode.Position(selection.start.line, 0),
          ),
        ),
      );
    }
    // 第x行
    const lineOffset = this.#getOffset(key, 'topLine');
    if (lineOffset) {
      if (selection.start.line - lineOffset < 0) {
        return '';
      }
      return document.getText(
        new vscode.Range(
          new vscode.Position(selection.start.line - lineOffset, 0),
          this.#getLastLinePosition(
            document,
            new vscode.Position(selection.start.line - lineOffset + 1, 0),
          ),
        ),
      );
    }
    // 前x章的文件
    let filesOffset = this.#getOffset(key, 'topFiles');
    if (filesOffset) {
      const numberFileList = [] as string[];
      do {
        let useNumber = false;
        const lastFileName = han2numberReChange(baseName, (a) => {
          if (!useNumber && typeof a === 'number') {
            useNumber = true;
            return `${a - filesOffset!}`;
          }
          return useNumber ? '' : `${a}`;
        });
        if (!useNumber) {
          break;
        }
        numberFileList.push(lastFileName);
        filesOffset--;
      } while (filesOffset);
      return dirFileList
        .map((item) => {
          return {
            compare: getNumberText(item),
            origin: item,
          };
        })
        .filter((item) => {
          return numberFileList.some(
            (numberItem) => numberItem === item.compare,
          );
        })
        .map(({ origin }) => origin)
        .sort(NumberCompare)
        .map((origin) =>
          this.#workspace.readFileByVSC(path.join(dirName, origin)),
        )
        .join('\n');
    }
    // 第x章的文件
    const fileOffset = this.#getOffset(key, 'topFile');
    if (fileOffset) {
      const numberFileList = [] as string[];
      let useNumber = false;
      const lastFileName = han2numberReChange(baseName, (a) => {
        if (!useNumber && typeof a === 'number') {
          useNumber = true;
          return `${a - fileOffset!}`;
        }
        return useNumber ? '' : `${a}`;
      });
      if (!useNumber) {
        return '';
      }
      numberFileList.push(lastFileName);

      return dirFileList
        .map((item) => ({
          compare: getNumberText(item),
          origin: item,
        }))
        .filter((item) => {
          return numberFileList.some(
            (numberItem) => numberItem === item.compare,
          );
        })
        .map(({ origin }) => origin)
        .sort(NumberCompare)
        .map((origin) =>
          this.#workspace.readFileByVSC(path.join(dirName, origin)),
        )
        .join('\n');
    }
    throw new Error('动态获取参数异常');
  }
  #createDefaultInput(
    input: Record<string, any>,
    document: vscode.TextDocument,
    selection: vscode.Selection,
    dirName: string,
    baseName: string,
    dirFileList: string[],
  ) {
    const proxy = new Proxy(input, {
      get: (target, p, receiver) => {
        if (typeof p !== 'string') {
          return;
        }

        return (
          this.#getDynamic(
            p,
            document,
            selection,
            dirName,
            baseName,
            dirFileList,
          ) ?? (target as any)[p]
        );
      },
    });
    return proxy;
  }
}
