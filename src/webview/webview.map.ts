import { WebviewPanel } from 'vscode';
import * as vscode from 'vscode';
import { Injector, inject } from 'static-injector';

import { WebViewMessageService } from '../trpc';
import { ExtensionContext } from '../token';
import { WebviewPage } from '../share';
import { WorkspaceService } from '../service/workspace.service';
import { path } from '@cyia/vfs2';
/** vscode */

export class WebviewMapService {
  #map = new Map<string, WebviewPanel>();
  readonly #astPrefix = 'ast-view-';
  #injector = inject(Injector);
  #context = inject(ExtensionContext);
  readonly #webviewPath = vscode.Uri.joinPath(
    this.#context.extensionUri,
    'webview',
  );
  #webviewMessage = inject(WebViewMessageService);
  constructor() {}

  async #createWebView(
    index: WebviewPage,
    key: string,
    webviewData: any,
    data?: any,
  ) {
    const config = {
      index: index,
      ...data,
    };
    if (this.#map.has(key)) {
      const instance = this.#map.get(key)!;
      instance.reveal();
      return instance;
    }
    const instance = await this.#createWebviewPanel(
      {
        filePath: this.#webviewPath,
        rootPath: this.#context.extensionUri,
        viewColumn: vscode.ViewColumn.One,
        type: key,
        ...webviewData,
      },
      config,
    );

    this.#map.set(key, instance);

    instance.onDidDispose(() => {
      this.#map.delete(key);
    });
    return instance;
  }

  async createWebView(title: string /** 真实fs路径 */, page: WebviewPage) {
    const instance = await this.#createWebView(
      page,
      `${this.#astPrefix}`,
      {
        title: `${title}`,
        viewColumn: vscode.ViewColumn.Beside,
      },
      { page: page },
    );

    this.#webviewMessage.addWebView(instance.webview);
    instance.onDidDispose(() => {
      this.#webviewMessage.removeWebView(instance.webview);
    });

    return instance;
  }

  #documentGenerate?: Promise<(config: Record<string, any>) => string>;
  #vfs = inject(WorkspaceService).rootVfs;
  async #changeWebviewHtml(
    webview: vscode.Webview,
    rootPath: vscode.Uri,
    pageConfig: Record<string, any>,
  ) {
    if (!this.#documentGenerate) {
      this.#documentGenerate = new Promise(async (resolve) => {
        const text = (await this.#vfs.readContent(
          path.join(rootPath.fsPath, 'index.html'),
        ))!.replace(
          /<base href(.*?)>/,
          `<base href="${webview.asWebviewUri(rootPath)}/">`,
        );
        const configStr = `window.__pageConfig`;
        const endIndex = text.indexOf(configStr) + configStr.length;
        const start = text.slice(0, endIndex);
        const end = text.slice(endIndex);
        const data = (config: Record<string, any>) => {
          return `${start}=${JSON.stringify(config)}${end}`;
        };
        resolve(data);
      });
    }
    const data = (await this.#documentGenerate)(pageConfig);
    return data;
  }

  #createWebviewPanelOnly(
    type: string,
    title: string,
    viewColumn: vscode.ViewColumn,
  ) {
    return vscode.window.createWebviewPanel(
      type, // 标识符，需要唯一
      title, // 标题
      { viewColumn: viewColumn }, // 第一列
      { enableFindWidget: true, retainContextWhenHidden: true },
    );
  }

  async #createWebviewPanel(
    options: {
      type: string;
      title: string;
      filePath: vscode.Uri;
      rootPath: vscode.Uri;
      viewColumn: vscode.ViewColumn;
    },
    pageConfig: {
      index: number;
      fsPath?: string;
      language: string;
      jwt: string;
      lightTheme: boolean;
    },
  ) {
    const webview = this.#createWebviewPanelOnly(
      options.type,
      options.title,
      options.viewColumn,
    );
    const content = await this.#changeWebviewHtml(
      webview.webview,
      options.filePath,
      pageConfig,
    );
    webview.webview.html = content;
    webview.webview.options = {
      enableScripts: true,
      // enableCommandUris: true,
      localResourceRoots: [options.filePath],
    };
    return webview;
  }
  async getMainHtml(
    panel: vscode.WebviewPanel,
    page: WebviewPage,
    data: Record<string, any>,
    extraContext?: Record<string, any>,
    compress?: Record<string, boolean>,
  ) {
    const webview = panel.webview;
    this.#webviewMessage.addWebView(webview, extraContext, compress);
    panel.onDidDispose(() => {
      this.#webviewMessage.removeWebView(webview);
    });
    return this.#changeWebviewHtml(webview, this.#webviewPath, {
      data,
      page,
    });
  }
  async getWebviewViewHtml(
    webviewView: vscode.WebviewView,
    page: WebviewPage,
    data: Record<string, any>,
    extraContext?: Record<string, any>,
  ) {
    const webview = webviewView.webview;
    this.#webviewMessage.addWebView(webview, extraContext);
    webviewView.onDidDispose(() => {
      this.#webviewMessage.removeWebView(webview);
    });
    return this.#changeWebviewHtml(webview, this.#webviewPath, {
      data,
      page,
    });
  }
}
