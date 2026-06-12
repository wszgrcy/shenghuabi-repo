import * as vscode from 'vscode';
import { Hanyu } from './const';
import {
  inject,
  RootStaticInjectOptions,
  Injector,
  createInjector,
  effect,
} from 'static-injector';

import { ChatMode } from '../../share';
import { WorkflowExecService, ResolvedWorkflow } from '@shenghuabi/workflow';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import { Subject, Subscription } from 'rxjs';
import { LLMWorkflowData, WorkflowStreamData } from '@shenghuabi/workflow';
import { WorkspaceService } from '../workspace.service';
import { path } from '@cyia/vfs2';
import { CodeChatActionOptions } from './code-action.service';
import { SingleNodeRunnerService } from '@shenghuabi/workflow';
import { KnowledgeConfigService } from '../knowledge/knowledge-config.service';
import { TOOL_CONFIG_LIST } from '../../share/tool-config';
import { toJsonSchema } from '@valibot/to-json-schema';
import * as v from 'valibot';
import { Agent, AgentMessage, AgentTool } from '@earendil-works/pi-agent-core';
import {
  UserMessage,
  AssistantMessage,
  TextContent,
} from '@earendil-works/pi-ai';
import { bufferToImageBase64 } from '@shenghuabi/knowledge/image';
import { bufferDecodeToText } from '@shenghuabi/knowledge/file-parser';
import fm from 'front-matter';
import {
  createEditTool,
  createGrepTool,
  createLsTool,
  createReadTool,
  createWriteTool,
} from '@earendil-works/pi-coding-agent';
import { getModelConfig } from '@shenghuabi/openai';
import { ChatService } from '../ai/chat.service';
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
  /** agent路径 */
  useFilePath: vscode.Uri;
  mode?: ChatMode;
  editorInput?: boolean;
  resolvedWorkflow?: ResolvedWorkflow;
  tools: string[];
}
export class CompletionService extends RootStaticInjectOptions {
  #workflowExec = inject(WorkflowExecService);
  #workflow = inject(WorkflowSelectService);
  #workspace = inject(WorkspaceService);
  #selectedEditorTemplate = new Map<string, InlineEditorData>();
  listSelect = new Subject<{ filePath: string; value: string }>();
  #selectSubscriptionMap = new Map<string, Subscription>();
  #injector = inject(Injector);
  #knowledgeConfig = inject(KnowledgeConfigService);
  /** 对话时使用 */
  activatedChatData!: {
    stream: vscode.ChatResponseStream;
    location2: vscode.ChatRequestEditorData;
  };
  #chat = inject(ChatService);
  constructor() {
    super();
    let disposeList: vscode.Disposable[] = [];
    // 更新知识库
    effect(() => {
      disposeList.forEach((item) => {
        item.dispose();
      });
      disposeList = [];
      const list = this.#knowledgeConfig.originConfigList$();
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
                const currentAction = context.valibotAction;
                if (
                  currentAction.type === 'metadata' &&
                  'toolJsonSchema' in (currentAction as any).metadata
                ) {
                  // 知识库改为枚举
                  if (
                    (currentAction as any).metadata.toolJsonSchema.needKnowledge
                  ) {
                    const newDefine = v.pipe(
                      v.picklist(list.map((item) => item.name)),
                      v.description(
                        list
                          .map((item) => {
                            return `\n- 类型: ${item.graphIndex ? 'graph-' + item.type : item.type} 名称: ${item.name}`;
                          })
                          .join('\n'),
                      ),
                    );
                    const newJsonSchema = toJsonSchema(newDefine);
                    delete newJsonSchema.$schema;
                    return {
                      ...newJsonSchema,
                      title: context.jsonSchema.title,
                    };
                  } else if (
                    (currentAction as any).metadata.toolJsonSchema
                      .needKnowledgeGraph
                  ) {
                    const newDefine = v.pipe(
                      v.picklist(
                        list
                          .filter(
                            (item) =>
                              item.graphIndex && item.type === 'knowledge',
                          )
                          .map((item) => item.name),
                      ),
                    );
                    const newJsonSchema = toJsonSchema(newDefine);
                    delete newJsonSchema.$schema;
                    return {
                      ...newJsonSchema,
                      title: context.jsonSchema.title,
                    };
                  } else if (
                    (currentAction as any).metadata.toolJsonSchema.replaceSchema
                  ) {
                    const newJsonSchema = toJsonSchema(
                      (currentAction as any).metadata.toolJsonSchema
                        .replaceSchema,
                    );
                    delete newJsonSchema.$schema;
                    return {
                      ...newJsonSchema,
                      title: context.jsonSchema.title,
                      description: context.jsonSchema.description,
                    };
                  }
                }
                if (!context.valibotAction.type) {
                  console.log(context.valibotAction);
                }
                return context.jsonSchema;
              },
            })
          : { type: 'object', properties: {} };
        const dispose = vscode.lm.registerToolDefinition(
          {
            name: item.type,
            source: undefined,
            tags: ['shenghuabi', item.type, 'extension_installed_by_tool'],
            toolReferenceName: item.type,
            displayName: item.type,
            description: item.help || '',
            icon: new vscode.ThemeIcon('edit'),
            inputSchema,
            userDescription: item.help || '',
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
        disposeList.push(dispose);
      }
    });
    // 更新模型
    effect((clean) => {
      const list = this.#chat.modelList$$();
      const res = vscode.lm.registerLanguageModelChatProvider('shenghuabi', {
        provideTokenCount: async () => {
          return 0;
        },
        provideLanguageModelChatInformation: () => {
          return list.map((item) => {
            return {
              id: item.name ?? item.model,
              name: item.name ?? item.model,
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
        provideLanguageModelChatResponse: async () => {},
      });
      clean(() => {
        res.dispose();
      });
    });
  }
  init() {
    vscode.languages.registerInlineCompletionItemProvider(Hanyu, {
      provideInlineCompletionItems: async (doc, pos, context, token) => {
        //todo 使用命令时进行补全
        return null;
      },
    });
    // todo
    const list = this.#chat.modelList$$();

    vscode.chat.createChatParticipant(
      'shenghuabi.chat.editor2',
      async (req, context, stream, token) => {
        let isEditor = false;
        let systemPrompt: string | undefined;
        let editorSupportTools: string[] = [];
        if (req.location2 instanceof vscode.ChatRequestEditorData) {
          isEditor = true;
          this.activatedChatData = { location2: req.location2, stream: stream };
          const filePath = req.location2.document.uri.fsPath;
          const data = this.#selectedEditorTemplate.get(filePath)!;
          const result = fm(
            bufferDecodeToText(
              await vscode.workspace.fs.readFile(data.useFilePath),
            ),
          );
          systemPrompt = result.body;
          editorSupportTools = data.tools;
        } else {
          if (req.modeInstructions2?.uri) {
            const data = bufferDecodeToText(
              await vscode.workspace.fs.readFile(req.modeInstructions2.uri),
            );
            const result = fm(data);
            systemPrompt = result.body;
          } else {
            systemPrompt = req.modeInstructions;
          }
        }
        // 获取当前活动文件和上下文
        const activeEditor = vscode.window.activeTextEditor;
        const activeTabInput =
          vscode.window.tabGroups.activeTabGroup.activeTab?.input;
        const currentFileUri =
          activeEditor?.document.uri ||
          (activeTabInput instanceof vscode.TabInputText
            ? activeTabInput.uri
            : undefined);

        // 构建文件引用列表
        const referenceUris = req.references
          .filter((ref) => !ref.name.startsWith('prompt'))
          .map((item) => {
            let filePath: string | undefined;
            if (item.value instanceof vscode.Uri) {
              filePath = item.value.fsPath;
            } else {
              const ref = (item.value as any)?.reference;
              filePath = ref instanceof vscode.Uri ? ref.fsPath : undefined;
            }
            return filePath
              ? path.relative(this.#workspace.nFolder(), filePath)
              : undefined;
          })
          .filter(Boolean) as string[];

        const fileContextParts: string[] = [
          `<工作区>${this.#workspace.nFolder()}</工作区>`,
          ...referenceUris.map((ref) => `<引用文件>${ref}</引用文件>`),
        ];

        if (currentFileUri) {
          fileContextParts.push(
            `<当前文件>${path.relative(this.#workspace.nFolder(), currentFileUri.fsPath)}</当前文件>`,
          );
        }
        if (isEditor) {
          const location2 = req.location2! as vscode.ChatRequestEditorData;
          const selection = location2.document.getText(location2.selection);
          fileContextParts.push(`<选中内容>${selection}</选中内容>`);
        }
        const model = list.find((item) => item.name === req.model.id)!;
        const modelConfig = getModelConfig(model);
        const result = new Agent({
          initialState: {
            systemPrompt: systemPrompt?.trim() || undefined,
            tools: [
              ...vscode.lm.tools
                .filter((item) => {
                  if (item.name === 'replace-select-string') {
                    return isEditor;
                  } else if (isEditor) {
                    const name =
                      (item.source && 'id' in item.source
                        ? `${item.source.id}/`
                        : '') + item.name;
                    return editorSupportTools!.includes(name);
                  }
                  return (
                    (req.tools.has(item) && req.tools.get(item)) ||
                    req.modeInstructions2?.toolReferences?.some(
                      (item2) => item.name === item2.name,
                    ) ||
                    req.toolReferences?.some(
                      (item2) => item.name === item2.name,
                    )
                  );
                })
                .map((item) => {
                  return {
                    label: '',
                    parameters: item.inputSchema ?? toJsonSchema(v.object({})),
                    description: item.description,
                    name: item.name,
                    execute: async (id, params, signal, onUpdate) => {
                      const result = await vscode.lm.invokeTool(item.name, {
                        input: params as any,
                        toolInvocationToken: req.toolInvocationToken,
                      });

                      const textList = result.content.filter((item) => {
                        return item instanceof vscode.LanguageModelTextPart;
                      });
                      if (textList.length) {
                        return {
                          content: result.content
                            .filter((item) => {
                              return (
                                item instanceof vscode.LanguageModelTextPart
                              );
                            })
                            .map((item) => {
                              return { text: item.value, type: 'text' };
                            }),
                          details: '',
                        };
                      }
                      const dataList = result.content.filter((item) => {
                        return item instanceof vscode.LanguageModelDataPart;
                      });
                      if (dataList.length) {
                        const imageList = dataList.filter((item) =>
                          item.mimeType.startsWith('image'),
                        );
                        if (imageList.length) {
                          return {
                            content: imageList.map((item) => {
                              return {
                                type: 'image',
                                data: bufferToImageBase64({
                                  type: item.mimeType,
                                  buffer: item.data,
                                }),
                                mimeType: item.mimeType,
                              };
                            }),
                            details: '',
                          };
                        }
                      }
                      return {
                        content: [
                          { type: 'text', text: '当前仅支持图片或文本' },
                        ],
                        details: '',
                      };
                    },
                  } satisfies AgentTool;
                }),
              createReadTool(this.#workspace.nFolder(), {
                autoResizeImages: false,
              }),
              createWriteTool(this.#workspace.nFolder()),
              createEditTool(this.#workspace.nFolder()),
              createLsTool(this.#workspace.nFolder()),
              createGrepTool(this.#workspace.nFolder()),
              // createFindTool(this.#workspace.nFolder()),
            ],
            messages: [
              {
                role: 'user',
                content: fileContextParts.join('\n'),
                timestamp: Date.now(),
              },
              ...context.history.map((item) => {
                if (item instanceof vscode.ChatRequestTurn) {
                  return {
                    role: 'user',
                    content: item.prompt,
                    timestamp: Date.now(),
                  } satisfies UserMessage;
                } else if (item instanceof vscode.ChatResponseTurn) {
                  return {
                    role: 'assistant',
                    content: item.response.map((item) => {
                      if (item instanceof vscode.ChatResponseMarkdownPart) {
                        return {
                          type: 'text',
                          text: item.value.value,
                        } satisfies TextContent;
                      }
                      debugger;
                      throw 'assistant,出现不支持';
                    }),
                    api: 'openai-completions',
                    provider: 'shenghuabi',
                    model: '',
                    usage: {
                      input: 0,
                      output: 0,
                      cacheRead: 0,
                      cacheWrite: 0,
                      totalTokens: 0,
                      cost: {
                        input: 0,
                        output: 0,
                        cacheRead: 0,
                        cacheWrite: 0,
                        total: 0,
                      },
                    },
                    stopReason: 'stop',
                    timestamp: Date.now(),
                  } satisfies AssistantMessage;
                }
                debugger;
                throw '未知对话历史项';
              }),
            ],
            model: modelConfig.model,
          },
          getApiKey: () => model.apiKey,
        });
        let thinkIndex = 0;
        token.onCancellationRequested((e) => {
          result.abort();
        });
        let lastEvent: AgentMessage[] | undefined;
        let editToolCalled = false;
        result.subscribe((event) => {
          // console.log(event);
          switch (event.type) {
            case 'agent_end': {
              lastEvent = event.messages;
              break;
            }
            case 'agent_start': {
              break;
            }
            case 'message_end': {
              // 没用
              // if (event.message.role === 'assistant') {
              //   if (event.message.stopReason === 'aborted') {
              //     stream.warning(
              //       `请求已被取消\n${event.message.errorMessage ?? ''}`,
              //     );
              //   }
              // }
              break;
            }
            case 'message_start': {
              break;
            }
            case 'message_update': {
              const assistantMessageEvent = event.assistantMessageEvent;
              switch (assistantMessageEvent.type) {
                case 'done': {
                  break;
                }
                case 'error': {
                  break;
                }
                case 'start': {
                  break;
                }
                case 'text_delta': {
                  stream.markdown(assistantMessageEvent.delta);
                  break;
                }
                case 'text_end': {
                  break;
                }
                case 'text_start': {
                  stream.progress('回答中');
                  break;
                }
                case 'thinking_delta': {
                  stream.thinkingProgress({
                    text: assistantMessageEvent.delta,
                    id: `res-${thinkIndex++}`,
                  });
                  break;
                }
                case 'thinking_end': {
                  break;
                }
                case 'thinking_start': {
                  stream.progress('思考中');
                  break;
                }
                case 'toolcall_delta': {
                  break;
                }
                case 'toolcall_end': {
                  break;
                }
                case 'toolcall_start': {
                  break;
                }
              }
              break;
            }
            case 'tool_execution_end': {
              editToolCalled = event.toolName === 'replace-select-string';
              if (editToolCalled) {
                result.abort();
              }
              break;
            }
            case 'tool_execution_start': {
              break;
            }
            case 'tool_execution_update': {
              break;
            }
            case 'turn_end': {
              break;
            }
            case 'turn_start': {
              break;
            }
          }
        });
        await result.prompt(req.prompt);
        if (isEditor && !editToolCalled && lastEvent) {
          const text = lastEvent
            .find((item) => item.role === 'assistant')
            ?.content.find((item) => item.type === 'text')?.text;
          if (text) {
            await vscode.lm.invokeTool('inline_chat_exit', {
              toolInvocationToken: req.toolInvocationToken,
              input: {
                response: text,
              },
            });
          }
        }
        return;
      },
    );
  }

  async codeActionResolve(options: CodeChatActionOptions) {
    const editorInput = false;

    this.#selectedEditorTemplate.set(options.filePath, {
      useFilePath: options.useFilePath,
      tools: options.tools,
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
}
