import * as v from 'valibot';
import { ChannelUse, t } from './t';
import { selectFile } from '../util/platform/select-file';
import { KnowledgeQueryResultTree } from '../webview/custom-sidebar/knowledge-query/result.tree';
import {
  CreateKnowledgeWithType,
  DictImportConfigWithType,
  EdgeAttr,
  KnowledgeEditType,
  KnowledgeQueryOptions,
  NodeAttr,
} from '../share';

import { ChatPromptEditWebview } from '../webview/custom-webview/chat-prompt-edit';
import { observable } from '@trpc/server/observable';

import { Attributes, SerializedGraph } from 'graphology-types';
import * as vscode from 'vscode';
import { DICT_PREFIX } from '../service/vector/const';
import { CustomKnowledgeManagerService } from '../service/knowledge/custom-knowledge.manager.service';
import { effect, EffectRef } from 'static-injector';
import { EMPTY_QUERY } from '../service/knowledge/const';
import { DictService } from '@shenghuabi/knowledge/file-parser';
import { contextDynamicInject } from '../token';
import { KnowledgeItemType } from '../share/define/knowledge/working-knowledge';
import { KnowledgeConfigService } from '../service/knowledge/knowledge-config.service';

export const KnowledgeRouter = t.router({
  create: ChannelUse('knowledge', '创建知识库')
    .input(v.custom<CreateKnowledgeWithType>(Boolean))
    .query(async ({ input, ctx }) => {
      const service = contextDynamicInject(
        ctx.injector,
        CustomKnowledgeManagerService,
      );
      await service.initKnoledge(input);
      return;
    }),
  importDict: ChannelUse('knowledge', '导入字典')
    .input(v.custom<DictImportConfigWithType>(Boolean))
    .query(async ({ input, ctx }) => {
      // 默认没有名字,需要先解析再获得名字...
      input.name = `${DICT_PREFIX}${input.name}`;
      const service = contextDynamicInject(
        ctx.injector,
        CustomKnowledgeManagerService,
      );
      await service.initKnoledge(input);
      return;
    }),
  selectFile: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    return selectFile(`请选择导入字典`, false, {
      [`所有`]: ['ifo', 'mdx', 'tar.bz2', 'yaml', 'yml', 'dsl'],
      stardict: ['ifo', 'tar.bz2'],
      dsl: ['dsl'],
      [`mdict(支持v1-v3)`]: ['mdx'],
      [`yaml`]: ['yaml', 'yml'],
    }).then((uri) => {
      return uri?.fsPath;
    });
  }),
  getDictFileName: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    return ctx.injector.get(DictService).getDictName(input);
  }),
  findAll: t.procedure
    .input(v.object({ type: v.string() }))
    .query(async ({ input, ctx }) => {
      const instance = ctx.injector.get(KnowledgeConfigService);

      return new Promise<KnowledgeItemType[]>(async (resolve) => {
        const ref = effect(
          () => {
            const loading = instance.configList$.isLoading();
            if (loading) {
              return;
            }
            ref.destroy();
            console.log(instance.originConfigList$());
            resolve(
              instance.originConfigList$().filter((item) => {
                return item.type === input.type;
              }),
            );
          },
          { injector: ctx.injector },
        );
      });
    }),

  query: t.procedure
    .input(v.custom<KnowledgeQueryOptions>(Boolean))
    .query(async ({ input, ctx }) => {
      return ctx.injector
        .get(KnowledgeQueryResultTree)
        .queryKnowledge(input, false);
    }),

  getGraph: t.procedure
    .input(v.object({ name: v.string() }))
    .subscription(async ({ input, ctx }) => {
      const service = contextDynamicInject(
        ctx.injector,
        CustomKnowledgeManagerService,
      );
      const result = await service.getGraph(input.name);

      return observable<
        SerializedGraph<NodeAttr, EdgeAttr, Attributes> | undefined
      >((ob) => {
        if (!result) {
          vscode.window.showWarningMessage(`未查询到图谱[${input.name}]`);
          ob.next(undefined);
          ob.complete();
          return;
        }
        let ref: EffectRef | undefined;
        (async () => {
          await result.loadDataInit$$();
          const knowledgeConfig = ctx.injector
            .get(KnowledgeConfigService)
            .originConfig$$()[input.name];
          ref = effect(
            () => {
              const exportData = result.graphExport$$();
              exportData.attributes['entityTypeList'] =
                knowledgeConfig.entityTypeList!;

              ob.next(exportData);
            },
            {
              injector: ctx.injector,
            },
          );
        })();

        return () => {
          ref?.destroy();
        };
      });
    }),
  graph: t.router({
    mergeNode: t.procedure
      .input(
        v.object({
          node: v.string(),
          list: v.array(v.string()),
          graphName: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.mergeNode(input);
      }),
    splitNode: t.procedure
      .input(
        v.object({
          node: v.string(),
          list: v.array(v.string()),
          graphName: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.splitNode(input);
      }),
    changeNodeDescription: t.procedure
      .input(
        v.object({
          nodeItem: v.any(),
          graphName: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.changeNodeDescription(input.nodeItem);
      }),
    changeEdgeData: t.procedure
      .input(
        v.object({
          nodeItem: v.any(),
          graphName: v.string(),
          oldNode: v.any(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.changeEdge(input.nodeItem, input.oldNode);
      }),
    getFileNameList: t.procedure
      .input(
        v.object({
          graphName: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.createQuery(EMPTY_QUERY).getFileNameList();
      }),
    getChunkContentList: t.procedure
      .input(
        v.object({
          graphName: v.string(),
          fileName: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance
          .createQuery(EMPTY_QUERY)
          .getChunkContent(input.fileName);
      }),
    getEntityTypeList: t.procedure
      .input(
        v.object({
          graphName: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = ctx.injector.get(KnowledgeConfigService);
        return instance.originConfig$$()[input.graphName].entityTypeList!;
      }),
    addNewNode: t.procedure
      .input(
        v.object({
          graphName: v.string(),
          options: v.any(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.add(input.options);
      }),
    deleteGraphNode: t.procedure
      .input(
        v.object({
          graphName: v.string(),
          options: v.any(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.deleteNodeItem(input.options);
      }),
    deleteGraphEdge: t.procedure
      .input(
        v.object({
          graphName: v.string(),
          options: v.any(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.deleteEdge(input.options);
      }),
    deleteNodeByName: t.procedure
      .input(
        v.object({
          graphName: v.string(),
          name: v.string(),
        }),
      )
      .query(async ({ input, ctx }) => {
        const instance = (await contextDynamicInject(
          ctx.injector,
          CustomKnowledgeManagerService,
        ).getGraph(input.graphName))!;
        return instance.deleteNodeByName(input.name);
      }),
  }),
  // 提示词处理相关

  closePanel: t.procedure
    .input(v.array(v.string()))
    .query(async ({ input, ctx }) => {
      const webview = ctx.injector.get(ChatPromptEditWebview);
      input.forEach((item) => {
        webview.close(item);
      });
    }),
  getPromptTemplate: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      return (ctx as any)['templateList'];
    }),
  promptChange: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    const webview = ctx.injector.get(ChatPromptEditWebview);
    const subject = webview.getEvent((ctx as any)['id'])!;
    subject.next(input);
    return;
  }),
  getKnowledgeConfig: t.procedure
    .input(v.any())
    .query(async ({ input, ctx }) => {
      const service = ctx.injector.get(KnowledgeConfigService);
      const config = service.originConfig$$()[(ctx as any)['name']];
      return {
        graphIndex: config.graphIndex,
        nameSuffix: '',
        collection: config.collectionList.find(
          (item) => item.collectionName === config.activateCollection,
        )!,
        activateCollection: config.activateCollection,
        collectionList: config.collectionList,
      };
    }),
  updateKnowledgeVector: t.procedure
    .input(v.custom<KnowledgeEditType>(Boolean))
    .query(async ({ input, ctx }) => {
      const service = contextDynamicInject(
        ctx.injector,
        CustomKnowledgeManagerService,
      );
      await service.addCollection2((ctx as any)['name'], {
        ...input.collection,
        collectionName: `${(ctx as any)['name']}-${input.nameSuffix}`,
      } as any);
      const config = ctx.injector.get(KnowledgeConfigService).originConfig$$()[
        (ctx as any)['name']
      ];
      return {
        graphIndex: config.graphIndex,
        nameSuffix: '',
        collection: config.collectionList.find(
          (item) => item.collectionName === config.activateCollection,
        )!,
        activateCollection: config.activateCollection,
        collectionList: config.collectionList,
      };
    }),
  changeActiveCollection: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      const name = (ctx as any)['name'];
      const service = contextDynamicInject(
        ctx.injector,
        CustomKnowledgeManagerService,
      );
      await service.changeActivateCollection2(name, input);
      const config = ctx.injector.get(KnowledgeConfigService).originConfig$$()[
        (ctx as any)['name']
      ];
      return {
        graphIndex: config.graphIndex,
        nameSuffix: '',
        collection: config.collectionList.find(
          (item) => item.collectionName === config.activateCollection,
        )!,
        activateCollection: config.activateCollection,
        collectionList: config.collectionList,
      };
    }),
  deletCollectionItem: t.procedure
    .input(v.string())
    .query(async ({ input, ctx }) => {
      const service = contextDynamicInject(
        ctx.injector,
        CustomKnowledgeManagerService,
      );
      await service.deleteCollection((ctx as any)['name'], input);
      const config = ctx.injector.get(KnowledgeConfigService).originConfig$$()[
        (ctx as any)['name']
      ];
      return {
        graphIndex: config.graphIndex,
        nameSuffix: '',
        collection: config.collectionList.find(
          (item) => item.collectionName === config.activateCollection,
        )!,
        activateCollection: config.activateCollection,
        collectionList: config.collectionList,
      };
    }),
});
