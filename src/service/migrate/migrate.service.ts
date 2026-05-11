import { inject } from 'static-injector';
import { ExtensionContext } from '../../token';
import { WorkspaceService } from '../workspace.service';
import { createNormalizeVfs, path } from '@cyia/vfs2';
export class MigrateService {
  #context = inject(ExtensionContext);
  #workspace = inject(WorkspaceService);
  async run() {
    const version = this.#context.globalState.get('version');
    if (!version) {
      //   await this.updateLLamaConifg();
      this.#context.globalState.update('version', '1.103.42');
    }
  }
  // 不用迁移,因为默认是auto
  // flash-attn
  async updateLLamaConifg() {
    const folder = this.#workspace.nFolder();
    if (!folder) {
      return;
    }
    const configPath = path.join(folder, '.ShengHuaBi/settings.json');
    const vfs = createNormalizeVfs();
    const result = await vfs.exists(configPath);
    if (!result) {
      return;
    }
    const config = JSON.parse(
      await vfs.readFile(configPath, { encoding: 'utf-8' }),
    );
    const data = config?.['shenghuabi.llama.config']?.['server']?.['list'];
    if (!data) {
      return;
    }
  }
}
