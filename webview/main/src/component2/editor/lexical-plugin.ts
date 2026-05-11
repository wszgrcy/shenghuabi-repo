import { ElementNode, LexicalEditor, LexicalNode, TextNode } from 'lexical';
import { TextMatchTransformer } from '@lexical/markdown';
import { Injector, Provider } from '@angular/core';
import { NODE_ITEM_META } from './card-editor.service';
export abstract class LexicalPlugin {
  abstract name: string;
  node!: typeof LexicalNode;
  abstract markdownToNode: (
    injector: Injector,
    root?: string,
  ) => TextMatchTransformer;
  nodeToMarkdown!: () => any;
  registerPlugin?: () => (props: any) => null;

  floatStatus?: (node: ElementNode | TextNode) => any;
  floatTool?: () => {
    icon: string;
    callback: (
      status: any,
      options: {
        editor: LexicalEditor;
        injector: Injector;
      },
    ) => any;
  }[];
  registerProviders?: () => Provider[];
  insertTool?: () => NODE_ITEM_META[];
}
