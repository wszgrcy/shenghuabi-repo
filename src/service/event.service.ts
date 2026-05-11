import { inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { SentenceDiffSystem } from './language/sensitive-word/sensitive-word.diff';
import { WorkspaceService } from './workspace.service';

import { PromptTree } from '../webview/custom-sidebar/prompt.tree';
import { Subject } from 'rxjs';

export class EventService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  init() {
    this.#listenEditor();
  }
  #promptTree = inject(PromptTree);

  #actionCallClose$ = new Subject<vscode.Uri>();
  editorClose$$ = this.#actionCallClose$.asObservable();
  #listenEditor() {
    const result = this.#workspace.formatPath(
      `{{extensionFolder}}/data/prompt`,
    );
    // 自动删除diff后的临时数据
    vscode.workspace.onDidCloseTextDocument((e) => {
      this.#actionCallClose$.next(e.uri);
      // 提示词模板刷新,虽然不准确,但是几乎没有问题了
      if (e.uri.scheme === 'file' && e.fileName.startsWith(result)) {
        this.#promptTree.refresh();
      } else if (e.uri.scheme === SentenceDiffSystem.scheme) {
        // 关闭时删除临时文件
        this.#workspace.rootVfs.delete(e.uri.fsPath);
      }
    });
  }
}
