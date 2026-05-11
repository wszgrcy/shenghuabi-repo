import { inject } from 'static-injector';
import { WebviewPage } from '../../share';
import * as vscode from 'vscode';
import { TempPathMap } from '../../class/path.map';
import { FlowDocument } from '../../service/flow-file/flow-document';
import { FlowFileBaseService } from '../../service/flow-file/flow-file.base.service';
import { RawFileService } from '../../service/mind/raw-file.service';
import type { RawFile } from '@cyia/bundle-file';

export class TTSEditorProvider
  extends FlowFileBaseService
  implements vscode.CustomEditorProvider<FlowDocument>
{
  static viewType = `shenghuabi.tts.editor` as const;
  override async afterInit(document: FlowDocument): Promise<void> {
    this.#paddingLoading.get(document.uri.fsPath)?.(document);
  }
  override getFile(filePath: string, tempDir: string): RawFile {
    const file = this.#fileService.getFile(filePath);
    file.setTemp(tempDir);
    return file;
  }
  override pageName = WebviewPage.ttsEditor;
  override compressPathObject: Record<string, boolean> = {
    // 'mind.dataChange': true,
  };

  #fileService = inject(RawFileService);

  #paddingLoading = new TempPathMap<
    ReturnType<typeof Promise.withResolvers<FlowDocument>>['resolve']
  >();
}
