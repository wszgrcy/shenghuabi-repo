import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { WebviewMapService } from '../webview.map';
import { WebviewPage } from '../../share';
import { Injector } from 'static-injector';
import { FolderName, WorkspaceService } from '../../service/workspace.service';
import { ExtensionContext } from '../../token';
export class EnvironmentConfiguration extends RootStaticInjectOptions {
  #webviewMap = inject(WebviewMapService);
  #inject = inject(Injector);
  panel: vscode.WebviewPanel | undefined;
  async open() {
    if (this.panel) {
      return this.panel.reveal();
    }
    const panel = vscode.window.createWebviewPanel(
      WebviewPage.environmentConfiguration,
      `环境配置`,
      { viewColumn: vscode.ViewColumn.Active },
      { enableFindWidget: true, retainContextWhenHidden: true },
    );
    this.panel = panel;
    const data = await this.#webviewMap.getMainHtml(
      panel,
      WebviewPage.environmentConfiguration,
      {},
    );
    panel.webview.html = data;
    const workspace = this.#inject.get(WorkspaceService);
    const context = this.#inject.get(ExtensionContext);
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(workspace.dir[FolderName.pythonAddon]()),
        context.extensionUri,
      ],
    };
    panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }
}
