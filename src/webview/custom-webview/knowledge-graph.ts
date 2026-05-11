import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { WebviewMapService } from '../webview.map';
import { WebviewPage } from '../../share';
import { ExtensionContext } from '../../token';
export class KnowledgeGraphWebview extends RootStaticInjectOptions {
  #webviewMap = inject(WebviewMapService);
  #cacheMap = new Map<string, vscode.WebviewPanel>();
  #context = inject(ExtensionContext);
  async open(
    title: string,
    graphName: string,
    options?: { viewColumn: vscode.ViewColumn },
  ) {
    let panel = this.#cacheMap.get(graphName);
    if (panel) {
      return panel.reveal();
    }
    panel = vscode.window.createWebviewPanel(
      WebviewPage.knowledgeGraph,
      title,
      { viewColumn: options?.viewColumn || vscode.ViewColumn.Active },
      {
        enableFindWidget: false,
        retainContextWhenHidden: true,
        enableScripts: true,
      },
    );
    this.#cacheMap.set(graphName, panel);
    const data = await this.#webviewMap.getMainHtml(
      panel,
      WebviewPage.knowledgeGraph,
      { graphName: graphName },
      undefined,
      { 'knowledge.getGraph': true },
    );
    panel.webview.html = data;
    panel.onDidDispose(() => {
      this.#cacheMap.delete(graphName);
    });
  }
}
