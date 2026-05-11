import { createEditor, SerializedEditorState } from 'lexical';
import { LexicalPlugin } from './lexical-plugin';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { PLAYGROUND_TRANSFORMERS } from './plugin/MarkdownTransformers';
import { $convertToMarkdownString } from '@lexical/markdown';

export function editorToMarkdown(
  state: SerializedEditorState,
  plugins: LexicalPlugin[],
) {
  const editor = createEditor({
    editable: false,
    namespace: 'editor',
    nodes: [
      ListNode,
      ListItemNode,
      HeadingNode,
      QuoteNode,
      CodeHighlightNode,
      CodeNode,
      TableCellNode,
      TableNode,
      TableRowNode,
      HorizontalRuleNode,
      ...plugins.map((item) => item.node),
    ],
    onError: (error) => {
      console.error(error);
    },
  });
  editor.setEditorState(editor.parseEditorState(state));
  return editor.read(() =>
    $convertToMarkdownString([
      ...PLAYGROUND_TRANSFORMERS,
      ...plugins.map((item) => item.markdownToNode(undefined as any)),
    ]),
  );
}
