import * as vscode from 'vscode';
import { uriEqual } from './uri-equal';
import { inject, RootStaticInjectOptions } from 'static-injector';
import { WorkspaceService } from '../service/workspace.service';

export class PlatformApi extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  getDocument(uri: vscode.Uri) {
    const list = vscode.workspace.textDocuments;
    for (const item of list) {
      if (uriEqual(item.uri, uri)) {
        return item.getText();
      }
    }
    return this.#workspace.rootVfs.readContent(uri.fsPath);
  }
}
