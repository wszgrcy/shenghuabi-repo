import * as vscode from 'vscode';
import EventEmitter from 'events';
import type { RawFile } from '@cyia/bundle-file';

export class FlowDocument implements vscode.CustomDocument {
  event = new EventEmitter();
  panel?: vscode.WebviewPanel;

  constructor(
    public file: RawFile,
    public uri: vscode.Uri,
  ) {}
  dispose(): void {
    return this.file.closeSelf();
  }
}
