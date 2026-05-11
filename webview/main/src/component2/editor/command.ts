import {
  createCommand,
  ElementNode,
  LexicalCommand,
  LexicalEditor,
} from 'lexical';

export const INJECT_NG_COMPONENT: LexicalCommand<{
  element: HTMLElement;
  component: any;
  inputs: {
    node: ElementNode;
    editor: LexicalEditor;
  };
}> = createCommand('INJECT_NG_COMPONENT');
