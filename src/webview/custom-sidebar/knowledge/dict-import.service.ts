import * as vscode from 'vscode';
import { RootStaticInjectOptions, inject } from 'static-injector';

import { CommandPrefix } from '@global';
import { ActionConfig } from '../../../service/ai/prompt.service';
import { WebviewMapService } from '../../webview.map';
import { WebviewPage } from '../../../share';
export interface CodeActionData {
  template: ActionConfig[number]['template'];
  input: { selection: string };
  documentChange: (value: string) => Promise<void>;
}
export class DictImportProvider
  extends RootStaticInjectOptions
  implements vscode.WebviewViewProvider
{
  #webviewMap = inject(WebviewMapService);

  public static readonly viewType = `${CommandPrefix}.dict.create`;

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    const html = await this.#webviewMap.getWebviewViewHtml(
      webviewView,
      WebviewPage.dictImport,
      {},
    );
    webviewView.webview.html = html;
    webviewView.webview.options = { enableScripts: true };
  }
}
