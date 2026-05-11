import * as vscode from 'vscode';

export function uriEqual(a: vscode.Uri, b: vscode.Uri) {
  return a.path === b.path;
}
