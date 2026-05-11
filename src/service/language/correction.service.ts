import { RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { mdCommand } from '@share/util/hover/command-format';
import { DiffChangeItem } from '@share/util/string/text-diff-edit';
import { v4 } from 'uuid';
import { contains, intersection } from 'interval-operations';
import { debounce } from 'lodash-es';
import { ExtensionConfig } from '../config.service';
type CorrectionChangeItem = DiffChangeItem & {
  id: string;
  start: number;
  end: number;
};
const changeObj = {
  replace: `替换`,
  before: '向前插入',
  after: '向后插入',
};

export class CorrectionService extends RootStaticInjectOptions {
  init() {
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (!editor) {
        return;
      }
      const list = this.#dataMap$.get(editor.document);
      if (!list) {
        return;
      }
      this.#doc2Editor$.set(editor.document, editor);
      setHover(editor, list.list, list.mode);
    }, null);
    // 切换消失
    const setHover = debounce(
      (
        editor: vscode.TextEditor,
        list: CorrectionChangeItem[],
        mode: 'sentence' | 'correction',
      ) => {
        this.setHover(editor, list, mode);
      },
      100,
    );
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (!event.contentChanges.length) {
        return;
      }
      // doc是每一个窗口一个,要想多个窗口都显示提示,就需要循环,然后处理
      if (this.#doc2Editor$.has(event.document)) {
        const editor = this.#doc2Editor$.get(event.document)!;
        const { list, mode } = this.#dataMap$.get(event.document)!;
        const textDeltaList = event.contentChanges.map((value) => ({
          offset: value.text.length - value.rangeLength,
          range: [
            event.document.offsetAt(value.range.start),
            event.document.offsetAt(value.range.end),
          ] as [number, number],
        }));
        for (let index = 0; index < list.length; index++) {
          const item = list[index];
          const range = [item.start, item.end] as [number, number];
          for (const changeItem of textDeltaList) {
            // 如果是在前面或者后面紧邻着的话,是否不需要处理?
            if (
              intersection(range, changeItem.range) ||
              contains(range, changeItem.range) ||
              contains(changeItem.range, range)
            ) {
              list.splice(index, 1);
              index--;
              break;
            } else if (changeItem.range[1] <= range[0]) {
              item.start += changeItem.offset;
              item.end += changeItem.offset;
            }
          }
        }
        setHover(editor, list, mode);
      }
    });
  }
  /** 绑定编辑器,用于activate变化 */
  #doc2Editor$ = new Map<vscode.TextDocument, vscode.TextEditor>();
  #dataMap$ = new Map<
    vscode.TextDocument,
    { list: CorrectionChangeItem[]; mode: 'sentence' | 'correction' }
  >();
  #styleDisposeMap$ = new Map<vscode.TextDocument, () => void>();
  // 用于命令调用
  #idDocMap = new Map<string, vscode.TextDocument>();
  #docIdMap = new Map<vscode.TextDocument, string>();
  setHover(
    editor: vscode.TextEditor,
    list: CorrectionChangeItem[],
    mode: 'sentence' | 'correction',
  ) {
    const documentId = this.#docIdMap.get(editor.document) ?? v4();
    this.#idDocMap.set(documentId, editor.document);
    const dispose = this.#styleDisposeMap$.get(editor.document);
    this.#dataMap$.set(editor.document, { list, mode });
    this.#doc2Editor$.set(editor.document, editor);
    const style = vscode.window.createTextEditorDecorationType(
      ExtensionConfig['sentence.editor'].highlight()!,
    );
    const hoverMessage = list.map((item) => {
      let pos1 = editor.document.positionAt(item.start);
      let pos2 = editor.document.positionAt(item.end);
      let isInsert: 'replace' | 'after' | 'before' = 'replace';
      if (item.start === item.end) {
        if (pos2.character === 0) {
          pos2 = editor.document.positionAt(item.end + 1);
          isInsert = 'before';
        } else {
          isInsert = 'after';
          pos1 = editor.document.positionAt(item.start - 1);
        }
      }
      const md = new vscode.MarkdownString(
        `应该${changeObj[isInsert]}: ${item.newValue} ${mdCommand('修改', 'correction.updateItem', [{ id: item.id, documentId }], { usePrefix: true })}`,
      );
      md.isTrusted = true;

      return {
        hoverMessage: md,
        range: new vscode.Range(pos1, pos2),
      } as vscode.DecorationOptions;
    });

    editor.setDecorations(style, hoverMessage);
    this.#styleDisposeMap$.set(editor.document, () => {
      style.dispose();
    });
    dispose?.();
  }
  changeItem(input: { id: string; documentId: string }) {
    const document = this.#idDocMap.get(input.documentId);
    if (!document) {
      return;
    }
    const data = this.#dataMap$.get(document);
    if (!data) {
      return;
    }

    const index = data.list.findIndex((item) => item.id === input.id);
    if (index === -1) {
      return;
    }
    const selectedItem = data.list[index];
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.replace(
      document.uri,
      new vscode.Range(
        document.positionAt(selectedItem.start),
        document.positionAt(selectedItem.end),
      ),
      selectedItem.newValue,
    );
    vscode.workspace.applyEdit(workspaceEdit);
  }
  clear(editor: vscode.TextEditor) {
    const doc = editor.document;
    const docId = this.#docIdMap.get(doc);
    if (docId) {
      this.#docIdMap.delete(doc);
      this.#idDocMap.delete(docId);
    }
    this.#styleDisposeMap$.get(doc)?.();
    this.#styleDisposeMap$.delete(doc);
    this.#doc2Editor$.delete(doc);
    this.#dataMap$.delete(doc);
  }
}
