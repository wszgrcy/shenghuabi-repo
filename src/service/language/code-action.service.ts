import { RootStaticInjectOptions, inject } from 'static-injector';
import * as vscode from 'vscode';
import { PromptService } from '../ai/prompt.service';
import { COMMAND, CommandPrefix } from '@global';
import { KnowledgeQueryOptions } from '../../share';
export interface CodeChatActionOptions {
  title: string;
  range: vscode.Range | vscode.Selection;
  filePath: string;
  document: vscode.TextDocument;
}
export class CodeActionService
  extends RootStaticInjectOptions
  implements vscode.CodeActionProvider
{
  #prompt = inject(PromptService);
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.Refactor,
  ];
  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken,
  ): Promise<(vscode.CodeAction | vscode.Command)[]> {
    if (
      range.start.line === range.end.line &&
      range.start.character === range.end.character
    ) {
      return [];
    }
    return [
      ...(await this.#getChatList(document, range)),
      ...(await this.#getKnowledgeList(document, range)),
    ];
  }

  async #getKnowledgeList(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
  ) {
    const createCommandFn = (rangeData: KnowledgeQueryOptions['range']) => {
      return {
        command: `${CommandPrefix}.knowledge-query.search`,
        title: '',
        arguments: [
          {
            query: document.getText(range),
            range: rangeData,
            source: 'codeAction',
          } as KnowledgeQueryOptions,
          (value: string) => {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, range, value);
            return vscode.workspace.applyEdit(edit);
          },
        ],
      };
    };
    const knowledge = new vscode.CodeAction(
      '查询知识库',
      vscode.CodeActionKind.RefactorRewrite,
    );
    knowledge.command = createCommandFn({ knowledge: true, dict: false });
    const dict = new vscode.CodeAction(
      '查询字典',
      vscode.CodeActionKind.RefactorRewrite,
    );
    dict.command = createCommandFn({ knowledge: false, dict: true });
    const all = new vscode.CodeAction(
      '查询所有',
      vscode.CodeActionKind.RefactorRewrite,
    );
    all.command = createCommandFn({ knowledge: true, dict: true });
    return [knowledge, dict, all];
  }
  async #getChatList(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
  ) {
    const list = await this.#prompt.actionConfig.getList();
    return list.map((item) => {
      const codeAction = new vscode.CodeAction(
        item.title,
        vscode.CodeActionKind.Refactor,
      );
      (codeAction as any).isAI = true;
      codeAction.command = {
        command: COMMAND['call-ai-chat-editor'],
        title: '',
        arguments: [
          {
            title: item.title,
            range: range,
            filePath: document.uri.fsPath,
            document: document,
          } as CodeChatActionOptions,
        ],
      };
      return codeAction;
    });
  }
  resolveCodeAction(
    codeAction: vscode.CodeAction,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.CodeAction> {
    return codeAction;
  }
}
