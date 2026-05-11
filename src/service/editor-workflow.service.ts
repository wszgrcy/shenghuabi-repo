import { inject, RootStaticInjectOptions } from 'static-injector';
import { ExtensionConfig } from './config.service';
import { WorkspaceService, FolderName } from './workspace.service';
import * as vscode from 'vscode';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import { WorkflowNativeSelectService } from '../native/workflow-select.service';
export type EditorWorkflowType = 'fullText' | 'sentence' | 'tts' | 'image';

export class EditorWorkflowService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);

  #workflow = inject(WorkflowSelectService);
  #workflowNativeSelect = inject(WorkflowNativeSelectService);
  getWorkflowPath(type: EditorWorkflowType) {
    if (type === 'tts') {
      return ExtensionConfig.tts.workflowPath();
    }
    return ExtensionConfig[`${type}.workflowPath`]();
  }
  setWorkflowPath(type: EditorWorkflowType, value: string) {
    if (type === 'tts') {
      return ExtensionConfig.tts.workflowPath.set(value);
    }
    return ExtensionConfig[`${type}.workflowPath`].set(value);
  }
  async getWorkflow(type: EditorWorkflowType) {
    const filePath = this.getWorkflowPath(type);
    return this.#workflow.get({ workflowName: filePath });
  }
  /** 工作流设置 */
  async workflowConfigSet(type: EditorWorkflowType, setWorkflow: boolean) {
    if (!this.getWorkflowPath(type) || setWorkflow) {
      const dir = this.#workspace.dir[FolderName.workflowDir]();
      if (!dir) {
        vscode.window.showWarningMessage(`未设置工作流文件夹,请先设置`);
        return false;
      }
      const result = await this.#workflowNativeSelect.selectWorkflow();
      if (result) {
        await this.setWorkflowPath(type, result);
      } else {
        vscode.window.showWarningMessage(`未选择工作流,设置终止`);
        return false;
      }
    }
    return true;
  }
}
