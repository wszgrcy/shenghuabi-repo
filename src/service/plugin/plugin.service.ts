import {
  computed,
  inject,
  RootStaticInjectOptions,
  signal,
} from 'static-injector';
import {
  ManifestDefine,
  ManifestReturnType,
  ManifestType,
  PluginNodeConfigType,
} from './define';
import * as v from 'valibot';
import { path } from '@cyia/vfs2';
import { isTruthy } from '@share/util/is-truthy';
import { uniqBy } from 'lodash-es';
import { TTSPluginSerivce } from '@shenghuabi/python-addon';
import { NodeItemDefine, WorkflowPluginService } from '@shenghuabi/workflow';

type ClientList = {
  config: PluginNodeConfigType['config'];
  filePath: string;
}[];
function addPlugin(uri: string, data: any) {
  return (obj: Record<string, any>) => {
    obj = { ...obj };
    obj[uri] = data;
    return obj;
  };
}
function deletePlugin(uri: string) {
  return (obj: Record<string, any>) => {
    obj = { ...obj };
    delete obj[uri];
    return obj;
  };
}
type ContextFn = (...args: any[]) => any;
export class PluginService extends RootStaticInjectOptions {
  #ttsPlugin = inject(TTSPluginSerivce);
  #providerObject$ = signal<
    Record<string, NonNullable<ManifestType['providers']>>
  >({});
  rootProviderList$$ = computed(() => {
    return Object.values(this.#providerObject$())
      .sort((a, b) => a.priority - b.priority)
      .map((item) => item.root)
      .filter(isTruthy)
      .flat();
  });
  knowledgeProviderList$$ = computed(() => {
    return Object.values(this.#providerObject$())
      .sort((a, b) => a.priority - b.priority)
      .map((item) => item.knowledge)
      .filter(isTruthy)
      .flat();
  });
  #clientObject$ = signal<
    Record<
      string,
      {
        config: ClientList;
        priority: number;
      }
    >
  >({});
  clientList$$ = computed(() => {
    return uniqBy(
      Object.values(this.#clientObject$())
        .sort((a, b) => {
          return b.priority - a.priority;
        })
        .map((item) => item.config)
        .flat(),
      (item) => item.config.type,
    );
  });
  nodeConditionObj$$ = computed(() => {
    return this.clientList$$()
      .map((item) => item.config)
      .reduce(
        (obj, item) => {
          if (item.nodeMode === 'condition') {
            obj[item.type] = true;
          }
          return obj;
        },
        {} as Record<string, boolean>,
      );
  });
  #serverObject$ = signal<
    Record<
      string,
      {
        config: Record<string, NodeItemDefine>;
        priority: number;
      }
    >
  >({});
  #runnerObject$$ = computed(() => {
    return Object.values(this.#serverObject$())
      .sort((a, b) => {
        return a.priority - b.priority;
      })
      .flatMap((item) => Object.values(item.config));
  });
  #contextObject$ = signal<
    Record<
      string,
      {
        config: Record<string, ContextFn>;
        priority: number;
      }
    >
  >({});
  contextObject$$ = computed(() => {
    return Object.values(this.#contextObject$())
      .sort((a, b) => {
        return a.priority - b.priority;
      })
      .reduce(
        (obj, item) => {
          return { ...obj, ...item.config };
        },
        {} as Record<string, ContextFn>,
      );
  });

  #workflowPlugin = inject(WorkflowPluginService);
  async register(uri: string, input: ManifestReturnType) {
    const config = v.parse(ManifestDefine, input);
    const clientList: ClientList = [];
    /** 当前插件的节点 */
    const serverObject = {} as Record<string, any>;
    if (config.workflow) {
      config.workflow.node.forEach((item) => {
        const defineUri = path.join(uri, `${item.client}`);
        clientList.push({
          config: item.config,
          filePath: new URL(
            `shb://flow-vfs/node-${item.config.type}?${new URLSearchParams([
              ['type', 'plugin'],
              ['filePath', defineUri],
              ['content-type', 'text/javascript'],
            ])}`,
          ).toString(),
        });
        serverObject[item.config.type] = {
          ...item.config,
          runner: item.runner,
        };
      });
      this.#clientObject$.update(
        addPlugin(uri, {
          priority: config.workflow.priority,
          config: clientList,
        }),
      );
      this.#serverObject$.update(
        addPlugin(uri, {
          priority: config.workflow.priority,
          config: serverObject,
        }),
      );
      if (config.workflow.context) {
        this.#contextObject$.update(
          addPlugin(uri, {
            priority: config.workflow.priority,
            config: config.workflow.context,
          }),
        );
      }
      this.#workflowPlugin.setNodeObject(this.#runnerObject$$());
    }
    if (config.providers) {
      this.#providerObject$.update(addPlugin(uri, config.providers!));
    }
    const disposeList: (() => void)[] = [];
    if (config.tts) {
      if (config.tts.changeAudioItemList) {
        for (const item of config.tts.changeAudioItemList) {
          disposeList.push(this.#ttsPlugin.registerAudioItem(item));
        }
      }
      if (config.tts.beforeConcatList) {
        for (const item of config.tts.beforeConcatList) {
          disposeList.push(this.#ttsPlugin.registerBeforeConcat(item));
        }
      }
      if (config.tts.afterConcatList) {
        for (const item of config.tts.afterConcatList) {
          disposeList.push(this.#ttsPlugin.registerAfterConcat(item));
        }
      }
    }
    return () => {
      if (config.workflow) {
        this.#clientObject$.update(deletePlugin(uri));
        this.#serverObject$.update(deletePlugin(uri));
        if (config.workflow.context) {
          this.#contextObject$.update(deletePlugin(uri));
        }
        this.#workflowPlugin.setNodeObject(this.#runnerObject$$());
      }
      if (config.providers) {
        this.#providerObject$.update(deletePlugin(uri));
      }
      disposeList.forEach((fn) => fn());
    };
  }
}
