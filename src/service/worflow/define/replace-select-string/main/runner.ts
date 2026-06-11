import { inject } from 'static-injector';
import { NodeRunnerBase } from '@shenghuabi/workflow';
import { REPLACE_SELECT_STRING_NODE_DEFINE } from '../node.define';
import { CompletionService } from '../../../../language/completion.service';
import * as vscode from 'vscode';
export class Runner extends NodeRunnerBase<
  typeof REPLACE_SELECT_STRING_NODE_DEFINE
> {
  #completion = inject(CompletionService);
  override async run() {
    return async (id: string) => {
      let data = this.#completion.activatedChatData;
      data.stream.textEdit(data.location2.document.uri, [
        new vscode.TextEdit(data.location2.selection, this.inputs.replace),
      ]);
    };
  }
}
