import * as vscode from 'vscode';
import { Hanyu } from './const';
import {
  inject,
  RootStaticInjectOptions,
  Injector,
  createInjector,
} from 'static-injector';
import { InlineChatService } from './inline-chat.service';
import { PromptService } from '../ai/prompt.service';
import { ChatService } from '../ai/chat.service';
import {
  AssistantChatMessageType,
  ChatMessageListInputType,
  ChatMode,
  deepClone,
} from '../../share';
import {
  WorkflowExecService,
  ResolvedWorkflow,
  ModelOptionsToken,
} from '@shenghuabi/workflow';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import { filter, Subject, Subscription, take } from 'rxjs';
import { LLMWorkflowData, WorkflowStreamData } from '@shenghuabi/workflow';
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
import { FunctionParameters } from 'openai/resources';
import { convertVSCodeMessagesToOpenAI } from './vscodeToOpenAIConverter';
import { EventEmitter } from 'vscode';
import { OpenAI } from 'openai';
import { SingleNodeRunnerService } from '@shenghuabi/workflow';
import { KnowledgeConfigService } from '../knowledge/knowledge-config.service';
import { TOOL_CONFIG_LIST } from '../../share/tool-config';
import { toJsonSchema } from '@valibot/to-json-schema';
export function isChatStream(
  data: WorkflowStreamData,
): data is LLMWorkflowData {
  return (
    !!data.extra && 'content' in data.extra && 'thinkContent' in data.extra
  );
}

function isEditorData(
  location: vscode.ChatRequest['location2'],
): location is vscode.ChatRequestEditorData {
  return location instanceof vscode.ChatRequestEditorData;
}
interface InlineEditorData {
  mode: ChatMode;
  editorInput: boolean;
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
  #injector = inject(Injector);
  #knowledgeConfig = inject(KnowledgeConfigService);

  init() {
    vscode.languages.registerInlineCompletionItemProvider(Hanyu, {
      provideInlineCompletionItems: async (doc, pos, context, token) => {
        //todo 使用命令时进行补全
        return null;
      },
    });
    const list = ExtensionConfig.chatModelList();
    const modelObject = {} as Record<string, NonNullable<typeof list>[number]>;
    const event = new EventEmitter<void>();

    for (const item of TOOL_CONFIG_LIST) {
      const inputSchema = item.configDefine
        ? toJsonSchema(item.configDefine, {
            ignoreActions: [
              'asControl',
              'trim',
              'viewRawConfig',
              'asVirtualGroup',
              'defineType',
            ],
            overrideAction: (context) => {
              if (!context.valibotAction.type) {
                console.log(context.valibotAction);
              }
              return context.jsonSchema;
            },
          })
        : { type: 'object', properties: {} };
      vscode.lm.registerToolDefinition(
        {
          name: item.type,
          source: undefined,
          tags: ['shenghuabi', item.type, 'extension_installed_by_tool'],
          toolReferenceName: item.type,
          displayName: item.type,
          description: item.help || '',
          icon: new vscode.ThemeIcon('files'),
          inputSchema,
        },
        {
          invoke: async (options) => {
            const injector = createInjector({
              providers: [SingleNodeRunnerService],
              parent: this.#injector,
            });
            const result = await injector
              .get(SingleNodeRunnerService)
              .run(item, options.input as any, {
                outputId: 'tool',
              });
            if (typeof result === 'string') {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(result),
              ]);
            } else if (typeof result === 'object') {
              return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(JSON.stringify(result)),
              ]);
              // todo 有问题,不支持传入
              // return new vscode.LanguageModelToolResult([
              //   vscode.LanguageModelDataPart.json(result),
              // ]);
            }
            return;
          },
        },
      );
    }
    vscode.lm.registerLanguageModelChatProvider(
      'shenghuabi',
      this.#inlineChat.createProvider({
        onDidChangeLanguageModelChatInformation: event.event,
        provideTokenCount: async (model, text, token) => {
          // 不准确
          return typeof text === 'string' ? text.length : 0;
        },
        provideLanguageModelChatInformation: (a) => {
          return list.map((item) => {
            return {
              id: item.name,
              name: item.name,
              tooltip: '',
              family: 'shenghuabi',
              maxInputTokens: 9999999,
              maxOutputTokens: 9999999,
              version: '1.0.0',
              capabilities: {
                toolCalling: true,
                imageInput: true,
              },
            };
          });
        },
        provideLanguageModelChatResponse: async (
          model,
          message,
          options,
          progress,
          token,
        ) => {
          const result = convertVSCodeMessagesToOpenAI(message);
          const list = await this.#knowledgeConfig.getOriginConfigList();
          const data = list.map((item) => {
            return `\n- 类型: ${item.graphIndex ? 'graph-' + item.type : item.type} 名称: ${item.name}`;
          });
          result[0].content = `\n## 现有知识库\n${data.join('\n')}`;
          const model2 = ExtensionConfig.chatModelList()[0];

          const openai = new OpenAI({
            baseURL: model2.baseURL,
            apiKey: model2.apiKey,
          });
          const resultxx = await openai.chat.completions.create({
            model: model2.model,
            messages: result,
            stream: true,
            tool_choice: options.toolMode === 1 ? 'auto' : 'required',
            tools: options.tools?.map((item) => {
              return {
                type: 'function',
                function: {
                  description: item.description,
                  name: item.name,
                  parameters: item.inputSchema as
                    | FunctionParameters
                    | undefined,
                },
              };
            }),
          });
          let toolList:
            | OpenAI.ChatCompletionChunk.Choice.Delta.ToolCall[]
            | undefined;
          const sendTool = () => {
            if (toolList) {
              for (const item of toolList) {
                progress.report(
                  new vscode.LanguageModelToolCallPart(
                    item.id!,
                    item.function!.name!,
                    item.function!.arguments
                      ? JSON.parse(item.function!.arguments)
                      : {},
                  ),
                );
              }
              toolList = undefined;
            }
          };
          for await (const item of resultxx) {
            if (item.choices[0].finish_reason === 'stop') {
              break;
            }

            const tool_calls = item.choices[0].delta.tool_calls;
            if (tool_calls) {
              if (!toolList) {
                toolList = tool_calls;
              } else {
                tool_calls.forEach((item, index) => {
                  const argStr = item.function?.arguments;
                  if (argStr) {
                    toolList![index].function!.arguments += argStr;
                  }
                });
              }
            }
            const deltaContent = item.choices[0].delta.content;

            if (typeof deltaContent === 'string') {
              if (deltaContent) {
                sendTool();
              }
              progress.report(new vscode.LanguageModelTextPart(deltaContent));
            }
          }
          sendTool();
        },
      }),
    );
    event.fire();
    const chatHistory = new Map<string, ChatMessageListInputType>();
    vscode.chat.createChatParticipant(
      'shenghuabi.chat.editor',
      async (req, context, stream, token) => {
        // todo 似乎只有编辑可以工作
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
        if (inlineEditorData.editorInput) {
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
                inputs: {},
                environmentParameters: defaultInput,
              },
              subject,
              abort.signal,
              [{ provide: ModelOptionsToken, useValue: modelOptions }],
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
                // inputs: {},
                // context: {},
                // modelOptions: modelOptions,
                environmentParameters: defaultInput,
                // inlineMode: true,
              },

              streamFn,
              abort.signal,
              [{ provide: ModelOptionsToken, useValue: modelOptions }],
            )
            .catch((rej) => {
              captureException(rej);
              throw rej;
            });
        }
        if (typeof result === 'string') {
          stream.textEdit(location2.document.uri, [
            new vscode.TextEdit(location2.selection, result),
          ]);
        } else if (isStringArray(result)) {
          this.#createCompletionListSelect(result, stream, location2);
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
    let editorInput = false;
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
      editorInput = !!result.editorInput;
      data = {
        resolvedWorkflow: result.data,
      };
    } else {
      const result = this.#templateFormat.parseConversationTemplate(
        actionItem.template,
      );

      data = {
        template: result as any,
      };
    }
    this.#selectedEditorTemplate.set(options.filePath, {
      ...data,
      mode: actionItem.mode,
      editorInput,
      input: {
        selection: selection,
      },
    });
    const range = options.range;
    vscode.commands.executeCommand(`vscode.editorChat.start`, {
      position: range.start,
      initialSelection: new vscode.Selection(range.start, range.end),
      initialRange: range,
      autoSend: !editorInput,
      message: '/default ',
    });
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
    document: vscode.TextDocument,
    selection: vscode.Selection,
    dirName: string,
    baseName: string,
    dirFileList: string[],
  ): {
    currentFile: string;
    selectionLine: string;
    lineOffsetTop: string;
    lineOffset: string;
    fileOffsetTop: string;
  } {
    const selectionLine = document.getText(
      new vscode.Range(
        new vscode.Position(selection.start.line, 0),
        this.#getLastLinePosition(
          document,
          new vscode.Position(selection.end.line + 1, 0),
        ),
      ),
    );

    const offsetCount = 20;
    const lineOffsetTop = document.getText(
      new vscode.Range(
        new vscode.Position(Math.max(0, selection.start.line - offsetCount), 0),
        this.#getLastLinePosition(
          document,
          new vscode.Position(selection.start.line + 1, 0),
        ),
      ),
    );

    const lineOffset = document.getText(
      new vscode.Range(
        new vscode.Position(Math.max(0, selection.start.line - offsetCount), 0),
        this.#getLastLinePosition(
          document,
          new vscode.Position(
            Math.min(document.lineCount - 1, selection.end.line + offsetCount),
            0,
          ),
        ),
      ),
    );

    const numberFileList = [] as string[];
    let filesOffsetCount = 5;
    do {
      let useNumber = false;
      const lastFileName = han2numberReChange(baseName, (a) => {
        if (!useNumber && typeof a === 'number') {
          useNumber = true;
          return `${a - filesOffsetCount!}`;
        }
        return useNumber ? '' : `${a}`;
      });
      if (!useNumber) {
        break;
      }
      numberFileList.push(lastFileName);
      filesOffsetCount--;
    } while (filesOffsetCount > 0);

    const fileOffsetTop = dirFileList
      .map((item) => ({
        compare: getNumberText(item),
        origin: item,
      }))
      .filter((item) => {
        return numberFileList.some((numberItem) => numberItem === item.compare);
      })
      .map(({ origin }) => origin)
      .sort(NumberCompare)
      .map((origin) =>
        this.#workspace.readFileByVSC(path.join(dirName, origin)),
      )
      .join('\n');

    return {
      currentFile: document.getText(),
      selectionLine,
      lineOffsetTop,
      lineOffset,
      fileOffsetTop,
    };
  }
  #createDefaultInput(
    input: Record<string, any>,
    document: vscode.TextDocument,
    selection: vscode.Selection,
    dirName: string,
    baseName: string,
    dirFileList: string[],
  ) {
    const dynamic = this.#getDynamic(
      document,
      selection,
      dirName,
      baseName,
      dirFileList,
    );
    return {
      ...input,
      ...dynamic,
    };
  }
}
