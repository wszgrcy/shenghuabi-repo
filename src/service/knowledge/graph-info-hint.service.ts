import {
  computed,
  inject,
  resource,
  RootStaticInjectOptions,
  untracked,
} from 'static-injector';
import { CustomKnowledgeManagerService } from './custom-knowledge.manager.service';
import { ExtensionConfig } from '../config.service';
import { formatNode } from '../../share';
import { deepEqual } from 'fast-equals';
import * as vscode from 'vscode';
import { isTruthy } from '@share/util/is-truthy';
import { dynamicInject } from '../../token';
import { KnowledgeConfigService } from './knowledge-config.service';

export class GraphInfoHintService extends RootStaticInjectOptions {
  #manager$$ = dynamicInject(CustomKnowledgeManagerService);
  #knowledgeConfig = inject(KnowledgeConfigService);
  #listenEditorConfig = computed(() => {
    const list = ExtensionConfig['knowledgeGraph.editor']();
    if (!list.enable) {
      return [];
    }
    return list.list;
  });
  #enabledGraph$$ = computed(
    () =>
      this.#knowledgeConfig
        .originConfigList$()
        .filter(
          ({ name, type, graphIndex }) => type === 'knowledge' && graphIndex,
        )
        .reduce(
          (obj, item) => {
            obj[item.name] = true;
            return obj;
          },
          {} as Record<string, boolean>,
        ),
    { equal: deepEqual },
  );
  #enabledList = computed(
    () => {
      return (
        this.#listenEditorConfig()?.filter(
          (item) =>
            (item.highlight?.enable || item.completion?.enable) &&
            this.#enabledGraph$$()[item.name],
        ) ?? []
      );
    },
    { equal: deepEqual },
  );
  #graphListRes$ = resource({
    params: () => {
      // 监听配置变化
      return this.#enabledList();
    },
    loader: ({ params }) =>
      // 获取所有graph实例
      Promise.all(
        params.map((config) => {
          if (!untracked(() => this.#manager$$().hasGraph(config.name))) {
            return undefined;
          }

          return this.#manager$$()
            .getGraph(config.name)
            .then(async (rag) => {
              if (!rag) {
                return undefined;
              }
              await rag.loadDataInit$$();
              // 初始化时可能不存在
              const graph = rag.getGraph();
              if (!graph) {
                return undefined;
              }
              return {
                config,
                rag,
                graph: graph,
              };
            });
        }),
      ).then((list) => list.filter(isTruthy)),
  });
  #graphList$$ = computed(() => this.#graphListRes$.value());
  editorList$$ = computed(() => {
    const graphList = this.#graphList$$();
    if (!graphList) {
      return undefined;
    }
    return graphList.map(({ graph, config, rag }) => {
      rag.local.update$();
      return {
        ...config,
        list: graph.mapNodes((id, attr) => {
          return {
            name: attr.list[0].name,
            description: new vscode.MarkdownString(formatNode(id, attr, graph)),
          };
        }),
      };
    });
  });
  completionList$$ = computed(() =>
    (this.editorList$$() ?? []).filter((graph) => graph.completion?.enable),
  );
  highlightList$$ = computed(() =>
    (this.editorList$$() ?? []).filter((graph) => graph.highlight?.enable),
  );
}
