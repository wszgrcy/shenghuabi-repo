import {
  computed,
  inject,
  Injector,
  linkedSignal,
  resource,
  RootStaticInjectOptions,
} from 'static-injector';
import * as v from 'valibot';
import { FolderName, WorkspaceService } from '../workspace.service';
import path from 'path';
import {
  KnowledgeFileDefine,
  KnowledgeFileType,
  KnowledgeItemType,
} from '../../share/define/knowledge/working-knowledge';
import { knowledgeMigrate } from '../vector/migrate';
import { parse, stringify } from 'yaml';

export class KnowledgeConfigService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  #injector = inject(Injector);

  #getKnowledgeDir() {
    return this.#workspace.dir[FolderName.knowledgeDir]();
  }
  #configFilePath$$ = computed(() => {
    return path.join(this.#getKnowledgeDir(), 'config.yml');
  });
  async #getConfig() {
    // todo 测试为空下如何表现
    const fileDir = this.#getKnowledgeDir();
    if (!fileDir) {
      return v.getDefaults(KnowledgeFileDefine);
    }
    const configPath = this.#configFilePath$$();
    if (!(await this.#workspace.rootVfs.exists(configPath))) {
      return v.getDefaults(KnowledgeFileDefine);
    }
    const content = await this.#workspace.rootVfs.readContent(configPath);
    const migrateResult = await knowledgeMigrate(
      content ? parse(content) : undefined,
      this.#injector,
    );
    if (migrateResult.update) {
      await this.#workspace.rootVfs.writeFile(
        configPath,
        stringify(migrateResult.value),
      );
    }
    return migrateResult.value as KnowledgeFileType;
  }
  configList$ = resource({
    params: () => this.#getConfig(),
    loader: ({ params }) => params.then(({ list }) => list),
  });
  originConfigList$ = linkedSignal(() => this.configList$.value() ?? []);

  /** 自动接受文件更新,但是也可以手动更新 */
  originConfig$$ = computed(() => {
    return (this.originConfigList$() ?? []).reduce(
      (obj, item) => {
        obj[item.name] = item;
        return obj;
      },
      {} as Record<string, KnowledgeItemType>,
    );
  });

  async updateConfig() {
    await this.#workspace.rootVfs.write(
      this.#configFilePath$$(),
      stringify({
        list: this.originConfigList$(),
        version: 4,
      }),
    );
  }
}
