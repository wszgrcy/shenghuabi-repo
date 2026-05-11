import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { WebviewMapService } from '../webview.map';
import { WebviewPage } from '../../share';
export class RichEditor
  extends RootStaticInjectOptions
  implements vscode.CustomTextEditorProvider
{
  #webviewMap = inject(WebviewMapService);
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken,
  ) {
    const data = await this.#webviewMap.getMainHtml(
      webviewPanel,
      WebviewPage.richEditor,
      { filePath: document.uri.fsPath },
    );
    webviewPanel.webview.html = data;
    webviewPanel.webview.options = { enableScripts: true };
  }
}
