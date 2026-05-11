import * as vscode from 'vscode';
import { RootStaticInjectOptions, inject } from 'static-injector';

import { CommandPrefix } from '@global';
import { WebviewMapService } from '../../webview.map';
import { WebviewPage } from '../../../share';

export class QuickPickWebviewProvider
  extends RootStaticInjectOptions
  implements vscode.WebviewViewProvider
{
  #webviewMap = inject(WebviewMapService);

  public static readonly viewType = `${CommandPrefix}.quick-pick`;

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    const html = await this.#webviewMap.getWebviewViewHtml(
      webviewView,
      WebviewPage.quickPick,
      {},
    );
    webviewView.webview.html = html;
    webviewView.webview.options = { enableScripts: true };
  }
}
