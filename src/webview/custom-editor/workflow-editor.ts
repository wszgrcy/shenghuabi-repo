import { inject } from 'static-injector';
import { WebviewPage } from '../../share';
import { FlowFileBaseService } from '../../service/flow-file/flow-file.base.service';
import { FlowDocument } from '../../service/flow-file/flow-document';
import type { RawFile } from '@cyia/bundle-file';
import { WorkflowFileService } from '@shenghuabi/workflow';
/**
 * 有一个初始化
 * 保存的时候和更新的时候更新初始化
 * 撤销的时候就是完全撤销
 */
export class WorkflowEditorProvider extends FlowFileBaseService {
  static readonly viewType = 'shenghuabi.workflow.editor' as const;
  getFile(filePath: string, tempDir: string): RawFile {
    const file = this.#fileService.getFile(filePath);
    file.setTemp(tempDir);
    file.needCloseSelf = true;
    return file;
  }
  async afterInit(): Promise<void> {}
  pageName = WebviewPage.workflow;
  compressPathObject: Record<string, boolean> = {
    'workflow.dataChange': true,
  };

  #fileService = inject(WorkflowFileService);
  protected override editorDispose(document: FlowDocument) {
    return document.file.close();
  }
}
