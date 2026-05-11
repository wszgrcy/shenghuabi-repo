import { BaseVfsLayer } from '@cyia/vfs2';
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
export class VSCodeVFS extends BaseVfsLayer {
  protected get textDocuments() {
    return vscode.workspace.textDocuments;
  }
  protected findTextDocument(path: string) {
    for (const item of this.textDocuments) {
      if (item.uri.scheme !== 'file') {
        continue;
      }
      const itemPath = item.uri.fsPath;
      if (itemPath === path) {
        return item;
      }
    }
    return undefined;
  }
  async readFile(...args: Parameters<(typeof fs)['readFile']>) {
    if (typeof args[0] !== 'string') {
      throw new Error('不支持非string类型');
    }
    const textDocument = this.findTextDocument(args[0]);
    return textDocument
      ? Buffer.from(textDocument.getText())
      : fs.readFile(...args);
  }
  writeFile(...args: Parameters<(typeof fs)['writeFile']>) {
    const textDocument = this.findTextDocument(args[0] as string);
    if (textDocument) {
      if (typeof args[1] !== 'string') {
        throw new Error('不支持非string类型');
      }
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.replace(
        textDocument.uri,
        new vscode.Range(
          textDocument!.positionAt(0),
          textDocument!.positionAt(textDocument!.getText().length),
        ),
        args[1],
      );
      return vscode.workspace.applyEdit(workspaceEdit) as any as Promise<void>;
    } else {
      return fs.writeFile(...args);
    }
  }
}
