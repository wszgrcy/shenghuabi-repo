import { inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { BrowserWindowConstructorOptions } from 'electron';
import { FolderName, WorkspaceService } from '../service/workspace.service';
import { path } from '@cyia/vfs2';
import { ExtensionConfig } from '../service/config.service';
const SHB_NATIVE = (vscode as any).shenghuabi as {
  $call: (id: string, args?: any) => Promise<any>;
};

export class WebGpuBrowserWindowService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  async create() {
    const filePath = this.#workspace.formatPath(
      path.normalize(`{{extensionFolder}}/data/webgpu/index.html`),
    );

    const preloadFilePath = this.#workspace.formatPath(
      path.normalize(`{{extensionFolder}}/data/webgpu/preload.js`),
    );

    const option: BrowserWindowConstructorOptions = {
      // todo 开发时暂时不隐藏
      width: 500,
      height: 500,
      show: !PROD_ENV,
      webPreferences: {
        devTools: !PROD_ENV,
        nodeIntegration: true,
        contextIsolation: true,
        experimentalFeatures: true,
        enableWebSQL: false,
        spellcheck: false,
        preload: preloadFilePath,
      },
    };
    return SHB_NATIVE.$call('electron', {
      method: 'createBrowserWindow',
      parameters: [option, `vscode-file://vscode-app/${filePath}`],
    });
  }
  init(): Promise<boolean> {
    const wasmPaths = this.#workspace.formatPath(
      path.normalize(`{{extensionFolder}}/data/webgpu/`),
    );
    return SHB_NATIVE.$call('electron', {
      method: 'sendToMain',
      parameters: [
        'shb:init',
        {
          dir: this.#workspace.dir[FolderName.text2vecDir](),
          modelName: ExtensionConfig.text2vec.modelName(),
          options: {
            dtype: ExtensionConfig.text2vec.dtype(),
            device: ExtensionConfig.text2vec.device(),
          },
          wasmPaths: `vscode-file://vscode-app/${wasmPaths}`,
          device: ExtensionConfig.text2vec.device(),
        },
      ],
    });
  }
  ping() {
    return SHB_NATIVE.$call('electron', {
      method: 'sendToMain',
      parameters: ['shb:ping', {}],
    });
  }
  extractor(str: string | string[]) {
    return SHB_NATIVE.$call('electron', {
      method: 'sendToMain',
      parameters: ['shb:extractor', str],
    });
  }

  getSize() {
    return SHB_NATIVE.$call('electron', {
      method: 'sendToMain',
      parameters: ['shb:size'],
    });
  }
  destroy() {
    return SHB_NATIVE.$call('electron', {
      method: 'destroy',
      parameters: [],
    });
  }
}
