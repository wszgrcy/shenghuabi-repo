import * as v from 'valibot';
import { t } from './t';
import { ModelOptionsToken, TemplateFormatService } from '@shenghuabi/workflow';
import { WorkflowParserService } from '@shenghuabi/workflow';
import { observable } from '@trpc/server/observable';
import { MindEvent } from '../share';
import { WorkflowSelectService, WorkflowData } from '@shenghuabi/workflow';
import { selectFile } from '../util/platform/select-file';
import { WorkspaceService } from '../service/workspace.service';
import * as vscode from 'vscode';
import { path } from '@cyia/vfs2';
import { ScriptEditorFileSystem } from '../service/script-editor/script-editor';
import { WorkflowExecService } from '@shenghuabi/workflow';
import { WorkflowStreamData } from '@shenghuabi/workflow';
import { MindService } from '../service/mind/mind.service';
import { ChatService } from '../service/ai/chat.service';
import { errorFormatByNode } from '@share/util/format/error-format-node';
import { DocumentRequest } from '../webview/custom-editor/type';
import { FlowDocument } from '../service/flow-file/flow-document';
import { CustomKnowledgeManagerService } from '../service/knowledge/custom-knowledge.manager.service';
import { EMPTY_QUERY } from '../service/knowledge/const';
import { PluginService } from '../service/plugin/plugin.service';
import { contextDynamicInject } from '../token';
import { effect } from 'static-injector';
import { KnowledgeConfigService } from '../service/knowledge/knowledge-config.service';
import { captureException } from '@sentry/node';
import { WorkflowNativeSelectService } from '../native/workflow-select.service';
import {
  ResolvedWorkflow,
  WorkflowRunnerInputsWithContext,
} from '@shenghuabi/workflow/share';

export const WorkflowRouter = t.router({
  convertChat: t.procedure
    .input(
      v.object({
        list: v.array(v.any()),
      }),
    )
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(TemplateFormatService);
      const content = input.list;

      return service.parseConversationTemplate(content);
    }),
  parseTemplate: t.procedure
    .input(
      v.object({
        content: v.string(),
        language: v.optional(v.picklist(['plaintext', 'js']), 'plaintext'),
      }),
    )
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(TemplateFormatService);
      const content = input.content;
      switch (input.language) {
        case 'js':
          return service.parserJs(content);
        case 'plaintext':
          return service.parse(content);
      }
    }),
  unParseTemplate: t.procedure
    .input(
      v.object({
        content: v.any(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(TemplateFormatService);
      const content = input.content;

      return service.unparse(content);
    }),
  getWorkflowInputList: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(WorkflowSelectService);
      const wpService = ctx.injector.get(WorkflowParserService);
      const result = await service.get({ workflowName: input });
      const result2 = wpService.parse(result);
      // todo 重构 工作流运行相关,需要透传参数
      return [];
    }),
  /** 工作流开发使用 */
  parseDefine: t.procedure
    .input(v.custom<WorkflowData>(Boolean))
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(WorkflowParserService);
      const result = service.parse(input);
      if (result.error) {
        vscode.window.showErrorMessage(
          `工作流编辑异常:\n${result.error.message}`,
        );
      }
      return result;
    }),
  /** 因为输入列表,所以还需要定义解析 */
  getWithDefine: t.procedure
    .input(v.object({ path: v.string() }))
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(WorkflowSelectService);
      const workflow = await service.get({ workflowName: input.path });
      const define = ctx.injector.get(WorkflowExecService).parse(workflow);
      if (define.error) {
        throw `工作流[${input.path}]解析失败`;
      }
      return { ...workflow, define: define.data };
    }),
  // 运行时直接用原始的,先解析在执行,但是加一个lru缓存
  chat: t.procedure
    .input(
      v.object({
        data: v.custom<
          Pick<WorkflowData, 'flow'> & { define?: ResolvedWorkflow }
        >(Boolean),
        input: v.optional(
          v.custom<WorkflowRunnerInputsWithContext>(Boolean),
          {},
        ),
        modelConfigName: v.optional(v.string()),
      }),
    )
    .subscription(async ({ input, ctx }) => {
      console.log('进来了?', input);
      const exec = ctx.injector.get(WorkflowExecService);
      const chatService = ctx.injector.get(ChatService);

      const abort = new AbortController();
      return observable<WorkflowStreamData>((ob) => {
        exec
          .exec(
            input.data,
            input.input,
            { showError: false },
            ob,
            abort.signal,
            [
              {
                provide: ModelOptionsToken,
                useValue: chatService.getModelConfig(input.modelConfigName),
              },
            ],
          )

          .catch((rej) => {
            captureException(rej);
            vscode.window.showErrorMessage(errorFormatByNode(rej));
          })
          .finally(() => {
            ob.complete();
          });
        return () => {
          abort.abort();
        };
      });
    }),
  selectArticleList: t.procedure
    .input(v.object({ title: v.string() }))
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(WorkspaceService);
      return selectFile(input.title, true).then((list) => {
        return list
          ?.map((item) => item.fsPath)
          .map((item) => {
            return service.shortPath(path.normalize(item));
          });
      });
    }),
  selectRagKnowledgeList: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      return ctx.injector
        .get(KnowledgeConfigService)
        .originConfigList$()
        .filter((item) => item.type === 'knowledge' && item.graphIndex);
    }),
  // todo 可以改成持续监听模式
  openTsEditor: t.procedure
    .input(
      v.object({
        title: v.string(),
        content: v.string(),
        output: v.optional(v.array(v.string())),
      }),
    )
    .subscription(async ({ input, ctx }) => {
      const service = ctx.injector.get(ScriptEditorFileSystem);
      return observable<string>((ob) => {
        (async () => {
          (await service.getSavedEditorScript(input)).subscribe({
            next: (value) => {
              ob.next(value);
            },
            complete: () => {
              ob.complete();
            },
          });
        })();
      });
    }),
  selectWorkflow: t.procedure
    .input(v.object({ type: v.optional(v.string()) }))
    .query(async ({ input, ctx }) => {
      return ctx.injector
        .get(WorkflowNativeSelectService)
        .selectWorkflow(input.type);
    }),
  selectCard: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    return ctx.injector.get(MindService).getCardList();
  }),
  selectGraphNode: t.procedure
    .input(
      v.object({
        graphName: v.string(),
        search: v.string(),
        selectedList: v.optional(v.array(v.string()), []),
      }),
    )
    .query(async ({ input, ctx }) => {
      return contextDynamicInject(ctx.injector, CustomKnowledgeManagerService)
        .getGraph(input.graphName)
        .then((instance) =>
          instance!
            .createQuery(EMPTY_QUERY)
            .searchNode(input.search, input.selectedList),
        )
        .then((list) => {
          return list.map((item) => {
            return { label: item, value: item };
          });
        });
    }),
  inited: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const document = (ctx as any)['document'] as FlowDocument;
    document.event.emit(MindEvent.inited);
  }),
  /** 初始化,撤销之类的,需要数据 */
  dataChange: t.procedure.subscription(({ input, ctx }) => {
    const document = (ctx as any)['document'] as FlowDocument;
    const updateEvent = document.event;
    return observable<any>((emit) => {
      const updateContent = async (data?: any) => {
        emit.next(data ?? (await document.file.readData()));
      };
      updateContent();
      updateEvent.on(MindEvent.update, updateContent);

      return () => {
        updateEvent.off(MindEvent.update, updateContent);
      };
    });
  }),
  /** 保存,另存为之类的,发射信号,被动监听 */
  listenEvent: t.procedure.subscription(({ input, ctx }) => {
    const document = (ctx as any)['document'] as FlowDocument;
    const updateEvent = document.event;
    // 传json直接,但是因为我有压缩算法,所以可以传输时压缩,这样zip里可以保存json了,资源外置
    return observable<DocumentRequest>((emit) => {
      const updateContent = async (value: DocumentRequest) => {
        emit.next(value);
      };
      updateEvent.on(MindEvent.toEditor, updateContent);
      return () => {
        updateEvent.off(MindEvent.toEditor, updateContent);
      };
    });
  }),
  sendEvent: t.procedure
    .input(
      v.object({
        id: v.number(),
        method: v.optional(v.string()),
        data: v.any(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const document = (ctx as any)['document'] as FlowDocument;
      document.event.emit(MindEvent.toEditorResponse, input);
    }),
  getPluginNodeList: t.procedure
    .input(v.any())
    .subscription(async ({ input, ctx }) => {
      const plugin = ctx.injector.get(PluginService);
      return observable<ReturnType<(typeof plugin)['clientList$$']>>((emit) => {
        const ref = effect(
          () => {
            emit.next(plugin.clientList$$());
          },
          {
            injector: ctx.injector,
          },
        );
        return () => {
          ref.destroy();
        };
      });
    }),
  pluginMethod: t.procedure
    .input(
      v.object({
        method: v.string(),
        args: v.optional(v.array(v.any()), []),
      }),
    )
    .query(async ({ input, ctx }) => {
      return ctx.injector
        .get(PluginService)
        .contextObject$$()
        [input.method](...input.args);
    }),
});
