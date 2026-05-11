import { inject } from 'static-injector';
import { DocumentEvent, WebviewPage } from '../../share';
import * as vscode from 'vscode';

import { TempPathMap } from '../../class/path.map';
import { MindFileService } from '../../service/mind/mind-file.service';
import { FlowDocument } from '../../service/flow-file/flow-document';
import { FlowFileBaseService } from '../../service/flow-file/flow-file.base.service';
import type { MindFile } from '@cyia/bundle-file';

/**
 * 有一个初始化
 * 保存的时候和更新的时候更新初始化
 * 撤销的时候就是完全撤销
 */
export class MindEditorProvider
  extends FlowFileBaseService
  implements vscode.CustomEditorProvider<FlowDocument>
{
  static viewType = `shenghuabi.mind.editor` as const;
  override async afterInit(document: FlowDocument): Promise<void> {
    this.#paddingLoading.get(document.uri.fsPath)?.(document);
  }
  override getFile(filePath: string, tempDir: string): MindFile {
    const file = this.#fileService.getFile(filePath);
    file.setTemp(tempDir);
    return file;
  }
  override pageName = WebviewPage.mind;
  override compressPathObject: Record<string, boolean> = {
    'mind.dataChange': true,
  };

  #fileService = inject(MindFileService);

  #paddingLoading = new TempPathMap<
    ReturnType<typeof Promise.withResolvers<FlowDocument>>['resolve']
  >();
  /** 聚焦节点 */
  async focusNode(filePath: string, nodeId: string) {
    let document = this.documentMap.get(filePath);
    if (!document) {
      const { promise, resolve } = Promise.withResolvers<FlowDocument>();
      this.#paddingLoading.set(filePath, resolve);
      vscode.commands.executeCommand(`vscode.open`, vscode.Uri.file(filePath));
      document = await promise;
    }
    document.panel!.reveal();

    this.sendToEditor(document, DocumentEvent.focusNode, {
      nodeId: nodeId,
    });
  }
}
