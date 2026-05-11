import { Tokens, lexer, Token } from 'marked';
import { BaseTreeItem, parserToTree } from './text-parser';
import { BridgeService } from '../service';
export class TextTreeItem extends BaseTreeItem {
  override async toData(service: BridgeService) {
    return this.data;
  }
}
export function mdToTextGroup(content: string) {
  const result = lexer(content);
  return parserToTree<Token, typeof TextTreeItem>(TextTreeItem, result, {
    isHeading(item) {
      return item.type === 'heading';
    },
    isList(item) {
      return item.type === 'list';
    },
    isBlock(item) {
      return false;
    },
    getDepth: (item: Tokens.Heading | Tokens.Generic) => {
      return item.depth;
    },
    getData(item: Tokens.Heading | Tokens.Text | Tokens.Tag | Tokens.Generic) {
      return item.text;
    },
    parserList(node, level, options) {
      const list: TextTreeItem[] = [];
      for (const child of node.items) {
        if (child.type === 'list_item') {
          const currentItem = new TextTreeItem();
          currentItem.depth = level;

          for (const item of child.tokens) {
            if (item.type === 'text') {
              currentItem.data = item.text;
              list.push(currentItem);
            } else if (item.type === 'list') {
              currentItem.children = options.parserList(
                item as Tokens.List,
                level,
                options,
              );
              currentItem.children.forEach((item) => {
                item.parent = currentItem;
              });
            }
          }
        }
      }
      return list;
    },
  });
}
