import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { WebviewMapService } from '../webview.map';
import { WebviewPage } from '../../share';
import { PathMap } from '../../class/path.map';
export class FileMarkdownWebview extends RootStaticInjectOptions {
  #webviewMap = inject(WebviewMapService);
  #cacheMap = new PathMap<vscode.WebviewPanel>();
  async open(title: string, filePath: string) {
    let panel = this.#cacheMap.get(filePath);
    if (panel) {
      return panel.reveal();
    }
    panel = vscode.window.createWebviewPanel(
      WebviewPage.markdown,
      title,
      { viewColumn: vscode.ViewColumn.Active },
      { enableFindWidget: true, retainContextWhenHidden: true },
    );
    this.#cacheMap.set(filePath, panel);
    const data = await this.#webviewMap.getMainHtml(
      panel,
      WebviewPage.markdown,
      { filePath },
    );
    panel.webview.html = data;
    panel.webview.options = { enableScripts: true };
    panel.onDidDispose(() => {
      this.#cacheMap.delete(filePath);
    });
  }
}
