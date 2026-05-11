import { SerializedEditorState } from 'lexical';

export interface EditorData {
  editorState: SerializedEditorState;
  markdownRoot?: string | undefined;
  markdown?: string | undefined;
  html?: string | undefined;
}
