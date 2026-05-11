import * as vscode from 'vscode';
import { FolderName, WorkspaceService } from '../workspace.service';
import { inject, RootStaticInjectOptions } from 'static-injector';
import { v5 } from 'uuid';
import { DocumentEvent, MindEvent, UUID_NS, WebviewPage } from '../../share';
import { path } from '@cyia/vfs2';
import * as fs from 'fs/promises';
import { ExtensionContext } from '../../token';
import { FlowDocument } from './flow-document';
import {
  DocumentRequest,
  DocumentResponse,
} from '../../webview/custom-editor/type';
import { PathMap } from '../../class/path.map';
import { WebviewMapService } from '../../webview/webview.map';
import { deepFilterObjectEmptyKey } from '@cyia/util';
import { deepEqual } from 'fast-equals';
import type { RawFile } from '@cyia/bundle-file';
/** 不只是流文件,应该说是自定义文件 */
export abstract class FlowFileBaseService
  extends RootStaticInjectOptions
  implements vscode.CustomEditorProvider<FlowDocument>
{
  #workspace = inject(WorkspaceService);
  #context = inject(ExtensionContext);
  #webviewMap = inject(WebviewMapService);
  protected documentMap = new PathMap<FlowDocument>();

  abstract getFile(filePath: string, tempDir: string): RawFile;
  abstract afterInit(document: FlowDocument): Promise<void>;
  abstract pageName: WebviewPage;
  abstract compressPathObject: Record<string, boolean>;
  protected async getTempDir(uri: vscode.Uri) {
    const id = v5(uri.fsPath, UUID_NS);
    const filePath = path.join(this.#context.storageUri!.fsPath, id);
    await fs.mkdir(filePath, { recursive: true });
    return filePath;
  }
  #requestId = 1;
  #firstInitMap = new PathMap<Promise<true>>();
  protected async sendToEditor<R = unknown>(
    document: FlowDocument,
    type: string,
    body?: any,
  ): Promise<R | undefined> {
    await this.#firstInitMap.get(document.uri.fsPath);
    const request: DocumentRequest = {
      id: this.#requestId++,
      method: type,
      args: [body],
    };
    return new Promise<any>((resolve) => {
      document.event.emit(MindEvent.toEditor, request);
      const responseFn = (response: DocumentResponse) => {
        if (response.id === request.id) {
          document.event.off(MindEvent.toEditorResponse, responseFn);
          resolve(response.data);
        }
      };
      document.event.on(MindEvent.toEditorResponse, responseFn);
    });
  }
  async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    token: vscode.CancellationToken,
  ) {
    const tempDir = openContext.backupId ?? (await this.getTempDir(uri));
    const file = this.getFile(uri.fsPath, tempDir);
    return new FlowDocument(file, uri);
  }

  readonly #_onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<FlowDocument>
  >();

  public readonly onDidChangeCustomDocument =
    this.#_onDidChangeCustomDocument.event;
  async resolveCustomEditor(
    document: FlowDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    document.panel = webviewPanel;
    const firstPromise$ = Promise.withResolvers<true>();
    this.#firstInitMap.set(document.uri.fsPath, firstPromise$.promise);
    document.event.once(MindEvent.inited, () => {
      firstPromise$.resolve(true);
      this.afterInit(document);
    });
    let lastData = await document.file.readData();
    // 借用事件实现
    document.event.on(
      MindEvent.toEditorResponse,
      (response: DocumentResponse) => {
        if (response.method === 'update') {
          const doc = deepFilterObjectEmptyKey(response.data);
          const lastDoc = lastData;
          // 这里的比较是否能优化
          if (deepEqual({ ...doc, update: 0 }, { ...lastDoc, update: 0 })) {
            return;
          }
          lastData = doc;
          this.#_onDidChangeCustomDocument.fire({
            document: document,
            redo: async () => {
              document.event.emit(MindEvent.update, doc);
              document.file.writeBackupDocument(doc);
              lastData = lastDoc;
            },
            undo: async () => {
              document.event.emit(MindEvent.update, lastDoc);
              document.file.writeBackupDocument(lastDoc);
              lastData = lastDoc;
            },
          });
        }
      },
    );
    const relInfo = this.#workspace.getRelFilePath2(document.uri.fsPath);

    const data = await this.#webviewMap.getMainHtml(
      webviewPanel,
      this.pageName,
      { filePath: document.uri.fsPath },
      {
        path: {
          absFilePath: path.normalize(document.uri.fsPath),
          absFileDir: relInfo.dir,
          relPath: relInfo.relFilePath,
        },
        document,
      },
      this.compressPathObject,
    );
    webviewPanel.webview.html = data;

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(this.#workspace.dir[FolderName.pythonAddon]()),
        this.#context.extensionUri,
      ],
    };
    this.documentMap.set(document.uri.fsPath, document);
    webviewPanel.onDidDispose(() => {
      this.documentMap.delete(document.uri.fsPath);
      this.#firstInitMap.delete(document.uri.fsPath);
      return this.editorDispose(document);
    });
  }
  protected editorDispose(document: FlowDocument) {}
  public async saveCustomDocument(
    document: FlowDocument,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    const data = await this.sendToEditor<any>(
      document,
      DocumentEvent.getContent,
    );
    if (cancellation.isCancellationRequested || !data) {
      return;
    }
    return document.file.save(data);
  }

  public async saveCustomDocumentAs(
    document: FlowDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    const data = await this.sendToEditor<any>(
      document,
      DocumentEvent.getContent,
    );
    if (cancellation.isCancellationRequested || !data) {
      return;
    }
    return document.file.saveAs(destination.fsPath, data);
  }
  // 不是普通撤销。而是恢复到保存的文件.右键关闭时弹出保存,然后不保存的处理
  public async revertCustomDocument(
    document: FlowDocument,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    await document.file.clearBackup();
    if (cancellation.isCancellationRequested) {
      return;
    }
    const diskContent = await document.file.readOriginData();
    document.event.emit(MindEvent.update, diskContent);
  }
  /** 临时备份 */
  public async backupCustomDocument(
    document: FlowDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken,
  ): Promise<vscode.CustomDocumentBackup> {
    const data = await this.sendToEditor<any>(
      document,
      DocumentEvent.getContent,
    );
    if (!cancellation.isCancellationRequested && data) {
      try {
        await document.file.writeBackupDocument(data);
      } catch (error) {
        console.error('写入备份文件失败', error);
      }
    }
    return {
      id: document.file.getBackupDir(),
      delete: async () => {},
    };
  }
}
