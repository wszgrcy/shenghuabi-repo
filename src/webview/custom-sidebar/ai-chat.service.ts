import * as vscode from 'vscode';
import { RootStaticInjectOptions, inject } from 'static-injector';
import { WebviewMapService } from '../webview.map';

import { CommandPrefix } from '@global';
import { PromptTemplateChatOption, WebviewPage } from '../../share';
import { BehaviorSubject } from 'rxjs';
import { WorkspaceService, FolderName } from '../../service/workspace.service';
import { ExtensionContext } from '../../token';
export interface CodeActionData {
  option: PromptTemplateChatOption;
  documentChange: (value: string) => Promise<void>;
}
export class AiChatProvider
  extends RootStaticInjectOptions
  implements vscode.WebviewViewProvider
{
  #webviewMap = inject(WebviewMapService);
  #workspace = inject(WorkspaceService);
  #context = inject(ExtensionContext);
  public static readonly viewType = `${CommandPrefix}.aiChat`;

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    const html = await this.#webviewMap.getWebviewViewHtml(
      webviewView,
      WebviewPage.aiChat,
      {},
    );
    webviewView.webview.html = html;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(this.#workspace.dir[FolderName.pythonAddon]()),
        this.#context.extensionUri,
      ],
    };
  }
  codeActionData$ = new BehaviorSubject<CodeActionData | undefined>(undefined);
  reset$ = new BehaviorSubject<boolean>(false);
}
