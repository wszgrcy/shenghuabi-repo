import { $createTextNode, ElementNode, LexicalEditor, TextNode } from 'lexical';
import { LexicalPlugin } from '../../lexical-plugin';
import {
  $createCustomLinkNode,
  $isCustomLinkNode,
  CustomLinkNode,
  TOGGLE_CUSTOM_LINK_COMMAND,
} from './linkNode';
import { CustomLinkPlugin } from './plugin/LexicalLinkPlugin';
import { TextMatchTransformer, LINK } from '@lexical/markdown';
import { Injector, Provider } from '@angular/core';
export class LinkLexicalPlugin extends LexicalPlugin {
  override name = CustomLinkNode.getType();
  override node = CustomLinkNode as any;
  constructor(registerProviders: () => Provider[]) {
    super();
    this.registerProviders = registerProviders;
  }
  override registerPlugin = () => {
    return CustomLinkPlugin;
  };
  override floatStatus = (node: ElementNode | TextNode) => {
    const parent = node.getParent();
    return $isCustomLinkNode(parent) || $isCustomLinkNode(node);
  };
  override floatTool = () => {
    return [
      {
        icon: 'link',
        callback: (
          status: any,
          options: {
            editor: LexicalEditor;
            injector: Injector;
          },
        ) => {
          if (!status) {
            options.editor.dispatchCommand(TOGGLE_CUSTOM_LINK_COMMAND, {
              method: 'create',
            });
          } else {
            options.editor.dispatchCommand(TOGGLE_CUSTOM_LINK_COMMAND, {
              method: 'delete',
            });
          }
        },
      },
    ];
  };
  override markdownToNode = () => {
    return {
      ...LINK,
      dependencies: [CustomLinkNode],
      importRegExp:
        /(?:\[([^[]+)\])(?:\((?:([^()\s]+)(?:\s"((?:[^"]*\\")*[^"]*)"\s*)?)(?:\s\?([^()]+))?\))/,
      replace: (textNode, match) => {
        const [, linkText, linkUrl, linkTitle, optionsStr] = match;
        if (optionsStr) {
          const options = JSON.parse(decodeURIComponent(optionsStr));
          if (options.type === 'node') {
            const linkNode = $createCustomLinkNode({
              nodeId: options.nodeId,
              type: 'node',
            });
            linkNode.append($createTextNode(linkText));
            // linkNode.insertAfter($createTextNode(' '))
            textNode.replace(linkNode);
          }
        }
      },
    } as TextMatchTransformer;
  };
}
export * from './token';
export * from './linkNode';
