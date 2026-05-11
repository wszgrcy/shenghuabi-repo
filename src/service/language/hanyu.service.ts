import { RootStaticInjectOptions, inject } from 'static-injector';
import { languages } from 'vscode';
import { WordService } from './word.service';
import { Hanyu } from './const';
import { CompletionService } from './completion.service';
import { CodeActionService } from './code-action.service';
import * as vscode from 'vscode';

export class HanyuService extends RootStaticInjectOptions {
  #hover = inject(WordService);
  #completion = inject(CompletionService);
  #codeAction = inject(CodeActionService);
  init() {
    this.#hover.init();
    this.#completion.init();
    vscode.languages.registerCodeActionsProvider(Hanyu, this.#codeAction, {
      providedCodeActionKinds: CodeActionService.providedCodeActionKinds,
    });
  }
  #todo() {
    // todo src/vs/editor/common/config/editorOptions.ts
    languages.setLanguageConfiguration(Hanyu, {
      // 分词优先级，中文，英文组，带符号准备补全的
      wordPattern:
        /\p{Script=Hani}|(\p{L}(?<!\p{Script=Hani}))+|(((?:[\p{P}\p{S}](?<![，。？！；：、“”‘’【】\[\]<>《》（）〔〕·\-~…—]))+)(.(?<=(\p{L}|\p{N})))+)+/gu,

      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: '<', close: '>' },
        { open: '《', close: '》' },
        { open: '（', close: '）' },
        { open: '【', close: '】' },
        { open: '“', close: '”' },
        { open: '‘', close: '’' },
        { open: '〔', close: '〕' },
      ],

      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
        ['"', '"'],
        ["'", "'"],
        ['<', '>'],
        ['《', '》'],
        ['（', '）'],
        ['【', '】'],
        ['“', '”'],
        ['‘', '’'],
        ['〔', '〕'],
      ],

      onEnterRules: [
        {
          beforeText: /[^]*/,
          action: {
            indentAction: vscode.IndentAction.Indent,
            appendText: '    ',
          },
        },
      ],
    });
  }
}
