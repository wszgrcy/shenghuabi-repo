import {
  RootStaticInjectOptions,
  computed,
  inject,
  signal,
} from 'static-injector';
import { FolderName, WorkspaceService } from '../workspace.service';
import { parse, stringify } from 'yaml';
import { PromptItem } from './prompt.type';
export type ActionConfig = PromptItem[];
/** 提示词模板服务 */
class ChatTemplateConfig {
  #update = signal(0);
  constructor(
    public readConfigPath: () => string,
    private workspace: WorkspaceService,
  ) {}
  async #getConfig() {
    const filePath = this.readConfigPath();
    if (!filePath || !(await this.workspace.rootVfs.exists(filePath))) {
      return [];
    }
    const content = (await this.workspace.rootVfs.readContent(filePath))!;
    const config = parse(content) as ActionConfig;

    return config;
  }

  getList = computed(() => {
    this.#update();
    return this.#getConfig();
  });
  refresh() {
    this.#update.update((a) => a + 1);
  }
  async updateItem(item: PromptItem, index?: number) {
    const list = await this.getList();
    if (typeof index === 'number') {
      list![index] = item;
    } else {
      index = list!.length;
      list!.push(item);
    }
    const filePath = this.readConfigPath();
    await this.workspace.rootVfs.write(filePath, stringify(list));
    this.#update.update((i) => i + 1);
    return index;
  }
  async deleteItem(index: number) {
    const list = await this.getList();
    if (typeof index === 'number') {
      list!.splice(index, 1);
      const filePath = this.readConfigPath();
      await this.workspace.rootVfs.write(filePath, stringify(list));
      this.#update.update((i) => i + 1);
    }
  }
}
export class PromptService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  actionConfig = new ChatTemplateConfig(
    () => this.#workspace.dir[FolderName.selectionPromptDir](),
    this.#workspace,
  );
  chatConfig = new ChatTemplateConfig(
    () => this.#workspace.dir[FolderName.commonPromptDir](),
    this.#workspace,
  );
}
