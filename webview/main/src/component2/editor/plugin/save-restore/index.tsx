import { Injector, untracked } from '@angular/core';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useCallback } from 'react';
import { CardEditorService } from '../../card-editor.service';

export function SaveRestorePlugin({ injector }: { injector: Injector }) {
  return (
    <OnChangePlugin
      ignoreHistoryMergeTagChange={true}
      ignoreSelectionChange={true}
      onChange={useCallback((editorState, editor) => {
        untracked(() => {
          if (!editor.isComposing()) {
            injector.get(CardEditorService).valueChange.set(editorState);
          }
        });
      }, [])}
    ></OnChangePlugin>
  );
}
