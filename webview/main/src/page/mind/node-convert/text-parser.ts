import { BridgeService } from '../service';

export class BaseTreeItem {
  children: BaseTreeItem[] = [];
  depth!: number;
  parent?: BaseTreeItem;
  data!: any;
  async toData(bridge: BridgeService): Promise<any> {
    throw '';
  }
}
interface ParserOptions<T, NODE extends BaseTreeItem> {
  isHeading: (item: T) => boolean;
  isList: (item: T) => boolean;
  isBlock: (item: T) => boolean;
  getDepth: (item: T) => number;
  getData: (item: T) => any;
  //   getListChildren: (item: any) => any[];
  parserList: (
    node: any,
    level: number,
    options: ParserOptions<T, NODE>,
  ) => NODE[];
  getDefault?: (lastItem: NODE | undefined, item: T, treeList: NODE[]) => void;
}
export function parserToTree<T, NODE extends typeof BaseTreeItem>(
  Define: NODE,
  list: Iterable<T>,
  options: ParserOptions<T, InstanceType<NODE>>,
) {
  const treeList: InstanceType<NODE>[] = [];
  let lastItem: InstanceType<NODE> | undefined;
  /**
   * 优先级,标题,block,列表
   */
  for (const item of list) {
    if (options.isHeading(item)) {
      // 列表类型
      const newItem = new Define() as InstanceType<NODE>;
      newItem.data = options.getData(item);
      newItem.depth = options.getDepth(item);

      if (!lastItem) {
        // 第一个
        treeList.push(newItem);
      } else if (newItem.depth > lastItem.depth) {
        // 前一个的子级
        newItem.parent = lastItem;
        lastItem.children.push(newItem);
      } else if (newItem.depth === lastItem.depth) {
        // 同级
        if (lastItem.parent) {
          // 有父级加入
          newItem.parent = lastItem.parent;
          lastItem.parent.children.push(newItem);
        } else {
          // 无父级处于顶级
          treeList.push(newItem);
        }
      } else {
        // 查找上级
        let parent = lastItem.parent;
        while (parent) {
          if (parent.depth === newItem.depth) {
            if (parent.parent) {
              newItem.parent = parent.parent;
              parent.parent.children.push(newItem);
            } else {
              treeList.push(newItem);
            }
            break;
          } else {
            parent = parent.parent;
          }
        }
        if (!parent) {
          treeList.push(newItem);
        }
      }
      lastItem = newItem;
    } else if (options.isList(item)) {
      const list = options.parserList(
        item,
        (lastItem?.depth ?? 0) + 1,
        options,
      );
      if (lastItem) {
        lastItem.children.push(...list);
        lastItem.children.forEach((item) => {
          item.parent = lastItem;
        });
      } else {
        treeList.push(...list);
      }
    } else {
      options.getDefault?.(lastItem, item, treeList);
    }
  }
  return treeList;
}
