import { defaultsDeep } from 'lodash-es';
import { BaseTreeItem, parserToTree } from './text-parser';
import { CardMindNode } from '@bridge/share';
import { BridgeService } from '../service';
import { DeepPartial } from 'utility-types';
import { SerializedEditorState, SerializedLexicalNode } from 'lexical';
import { SerializedListItemNode, SerializedListNode } from '@lexical/list';

class CardItem extends BaseTreeItem {
  override children: CardItem[] = [];
  override async toData(service: BridgeService) {
    if (!this.data) {
      return;
    }
    const type = this.data.type;
    const config = await service.getDefaultConfig(type, {
      open: this.data.data?.status?.open,
    })!;
    return {
      type,
      ...config,
      data: defaultsDeep(this.data.data, config.data),
    };
  }
}
export function cardDomConvertList(
  html: SerializedEditorState<SerializedLexicalNode>,
) {
  const getData = (data: SerializedLexicalNode, liConvert?: boolean) => {
    if (!(data as any).children.length) {
      return;
    }
    return {
      type: 'card',
      data: {
        status: { open: 'content', editorInteractionMode: 'displayFirst' },
        value: {
          editorState: {
            root: {
              children: [
                liConvert
                  ? {
                      children: (data as any).children,
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      textFormat: 0,
                      textStyle: '',
                      type: 'paragraph',
                      version: 1,
                    }
                  : data,
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          } as SerializedEditorState<SerializedLexicalNode>,
        },
      },
    } as DeepPartial<CardMindNode>;
  };

  const list = html.root.children;
  // 这个是引用
  return parserToTree<SerializedLexicalNode, typeof CardItem>(CardItem, list, {
    // 用来判断是多少层
    isHeading: (item) => {
      return item.type === 'heading';
    },
    isList: (item) => {
      return item.type === 'list';
    },
    isBlock(item) {
      return false;
    },
    getDepth: (item) => {
      if (item.type === 'heading') {
        return +(item as any).tag.slice(1);
      }

      return 0;
    },
    getData: (item) => {
      return getData(
        item,
        item.type === 'heading',
      ) as DeepPartial<CardMindNode>;
    },
    parserList: (node: SerializedListNode, depth, options) => {
      const list: CardItem[] = [];
      let lastItem: CardItem;
      for (const li of node.children) {
        const currentItem: CardItem = new CardItem();
        currentItem.depth = depth;

        if ((li as SerializedListItemNode).children[0].type === 'list') {
          const subList = options.parserList(
            (li as SerializedListItemNode).children[0],
            depth + 1,
            options,
          );
          lastItem!.children = subList;
          subList.forEach((item) => {
            item.parent = lastItem;
          });
        } else {
          // li 去掉li.然后加上p
          currentItem.data = getData(li, true) as DeepPartial<CardMindNode>;
          list.push(currentItem);
        }
        lastItem = currentItem;
      }
      return list;
    },
    getDefault: (lastItem, item, treeList) => {
      const newItem: CardItem = new CardItem();
      newItem.data = getData(item) as DeepPartial<CardMindNode>;
      newItem.depth = (lastItem?.depth ?? 0) + 1;
      newItem.parent = lastItem;
      if (lastItem) {
        lastItem.children.push(newItem);
      } else {
        treeList.push(newItem);
      }
    },
  });
}
