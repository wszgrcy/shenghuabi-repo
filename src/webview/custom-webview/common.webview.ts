import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { WebviewMapService } from '../webview.map';
import { WebviewPage } from '../../share';
import { Subject } from 'rxjs';
export abstract class CommonWebview extends RootStaticInjectOptions {
  #webviewMap = inject(WebviewMapService);
  #cacheMap = new Map<string, vscode.WebviewPanel>();
  #eventMap = new Map<string, Subject<any>>();
  protected abstract viewType: WebviewPage;
  getEvent(id: string) {
    return this.#eventMap.get(id);
  }
  async open(
    title: string,
    id: string,
    context: Record<string, any>,
    options?: { viewColumn?: vscode.ViewColumn; data?: any },
  ) {
    let panel = this.#cacheMap.get(id);
    if (panel) {
      return panel.reveal();
    }
    panel = vscode.window.createWebviewPanel(
      this.viewType,
      title,
      { viewColumn: options?.viewColumn || vscode.ViewColumn.Active },
      {
        enableFindWidget: true,
        retainContextWhenHidden: true,
        enableScripts: true,
      },
    );
    this.#cacheMap.set(id, panel);
    const subject = new Subject();
    this.#eventMap.set(id, subject);
    const data = await this.#webviewMap.getMainHtml(
      panel,
      this.viewType,
      { ...options?.data, id: id },
      context,
    );
    panel.webview.html = data;
    panel.onDidDispose(() => {
      subject.complete();
      this.#cacheMap.delete(id);
    });
  }

  async close(id: string) {
    const item = this.#cacheMap.get(id);
    if (item) {
      item.dispose();
      this.#cacheMap.delete(id);
    }
  }
}
