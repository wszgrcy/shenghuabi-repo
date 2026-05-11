import { inject } from 'static-injector';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import * as vscode from 'vscode';
import { formatTime } from '@cyia/util';

export class WorkflowNativeSelectService {
  #service = inject(WorkflowSelectService);
  async selectWorkflow() {
    const list = await this.#service.getList();
    const result = await vscode.window.showQuickPick(
      list
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime())
        .map((item) => ({
          label: item.relPath,
          value: item.relPath,
          description: `修改于 ${formatTime(item.stat.mtime)}`,
        })),
      {
        title: `选择运行的工作流`,
      },
    );
    return result?.value;
  }
}
