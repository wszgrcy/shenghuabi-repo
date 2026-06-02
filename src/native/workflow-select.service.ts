import { inject, computed } from 'static-injector';
import * as vscode from 'vscode';
import { WatchService } from '../service/fs/watch.service';

export class WorkflowNativeSelectService {
  #watch = inject(WatchService);

  async selectWorkflow(type?: string) {
    let list =
      (type
        ? this.#watch.workflowList$()?.filter((item) => {
            return type === item.data.options?.type;
          })
        : this.#watch.workflowList$()) ?? [];
    const result = await vscode.window.showQuickPick(
      list.map((item) => ({
        label: item.relPath,
        value: item.relPath,
      })),
      {
        title: `选择运行的工作流`,
      },
    );
    return result?.value;
  }
}
