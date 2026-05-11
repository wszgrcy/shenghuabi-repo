import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { WebviewMapService } from '../webview.map';
import { WebviewPage } from '../../share';
import { ExtensionContext } from '../../token';
export class IdAssetReferenceWebview extends RootStaticInjectOptions {
  #webviewMap = inject(WebviewMapService);
  #cacheMap = new Map<string, vscode.WebviewPanel>();
  assetMap = new Map<string, { type: string; [name: string]: any }>();
  #context = inject(ExtensionContext);
  async open(
    title: string,
    id: string,
    options?: { viewColumn: vscode.ViewColumn; assets?: vscode.Uri[] },
  ) {
    let panel = this.#cacheMap.get(id);
    if (panel) {
      return panel.reveal();
    }
    panel = vscode.window.createWebviewPanel(
      WebviewPage.idAsset,
      title,
      { viewColumn: options?.viewColumn || vscode.ViewColumn.Active },
      {
        enableFindWidget: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          ...(options?.assets || []),
          this.#context.extensionUri,
        ],
        enableScripts: true,
      },
    );
    this.#cacheMap.set(id, panel);
    const data = await this.#webviewMap.getMainHtml(
      panel,
      WebviewPage.idAsset,
      { id: id },
    );
    panel.webview.html = data;
    panel.onDidDispose(() => {
      this.#cacheMap.delete(id);
    });
  }
}
