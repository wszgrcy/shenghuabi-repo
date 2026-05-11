import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical';

import {
  $applyNodeReplacement,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  createCommand,
  ElementNode,
} from 'lexical';
import { CustomLinkComponent } from './component';
import { $findMatchingParent } from '@lexical/utils';
import { Injector, signal } from '@angular/core';
import { INJECT_NG_COMPONENT } from '../../command';
import { deepEqual } from 'fast-equals';
import * as v from 'valibot';
import { deepClone } from '../../util/clone';
const CUSTOM_LINK_DEFINE = v.object({
  href: v.optional(v.string()),
  title: v.optional(v.string()),
  nodeId: v.string(),
  type: v.picklist(['node', 'article']),
  filePath: v.optional(v.string()),
});
function $convertLinkElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLAnchorElement;
  const { href, title } = img;

  const node = $createCustomLinkNode({
    href,
    title,
    nodeId: img.dataset['nodeid']!,
    type: 'node',
  });
  return { node };
}
/** 节点内使用 */
export type CustomLinkPayload = v.InferOutput<typeof CUSTOM_LINK_DEFINE>;
/** 转换时使用 */
export type SerializedCustomLinkNode = Spread<
  {
    options: CustomLinkPayload;
    key?: NodeKey;
  },
  SerializedElementNode
>;

export class CustomLinkNode extends ElementNode {
  updateComp$ = signal<((input: CustomLinkPayload) => void) | undefined>(
    undefined,
  );
  static override getType() {
    return 'custom-link' as const;
  }

  static override clone(node: CustomLinkNode): CustomLinkNode {
    const instance = new CustomLinkNode(node.options, node.getKey());
    instance.updateComp$.set(node.updateComp$());
    return instance;
  }

  static override importJSON(
    serializedNode: SerializedCustomLinkNode,
  ): CustomLinkNode {
    const node = $createCustomLinkNode(
      serializedNode.options,
      serializedNode.key,
    );
    return node;
  }
  override exportJSON(): SerializedCustomLinkNode {
    return {
      ...super.exportJSON(),
      options: this.options,
      type: CustomLinkNode.getType(),
      version: 1,
    };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: $convertLinkElement,
        priority: 0,
      }),
    };
  }
  override exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('a');
    element.dataset['moveNodeId'] = this.options.nodeId;
    element.dataset['nodeType'] = 'custom-link';
    if (this.options.title) {
      element.title = this.options.title!;
    }
    return {
      element: element,
    };
  }
  constructor(
    public options: CustomLinkPayload,
    key?: NodeKey,
  ) {
    super(key);
  }

  override createDOM(
    config: EditorConfig,
    _editor: LexicalEditor,
  ): HTMLElement {
    const span = document.createElement('a');
    span.className = config.theme.link!;

    // (span as any).inputNode = this;
    _editor.dispatchCommand(INJECT_NG_COMPONENT, {
      element: span,
      inputs: {
        node: this,
        editor: _editor,
      },
      component: CustomLinkComponent,
    });

    return span;
  }

  override updateDOM(
    prevNode: CustomLinkNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): false {
    this.updateComp$()?.(this.options);
    return false;
  }

  override canInsertTextBefore(): false {
    return false;
  }

  override canInsertTextAfter(): false {
    return false;
  }

  override canBeEmpty(): false {
    return false;
  }

  override isInline(): true {
    return true;
  }
  override insertNewAfter(
    _: RangeSelection,
    restoreSelection = true,
  ): null | ElementNode {
    const linkNode = $createCustomLinkNode(this.options);
    this.insertAfter(linkNode, restoreSelection);
    return linkNode;
  }

  update(payload: Partial<CustomLinkPayload>): void {
    if (deepEqual(payload, this.options)) {
      return;
    }
    const writable = this.getWritable();
    const options = deepClone(writable.options);
    for (const key in payload) {
      const value = (payload as any)[key];
      if (typeof value === 'undefined') {
        continue;
      }
      (options as any)[key] = value;
    }
    writable.options = options;
  }
}
/** 自定义链接使用,可以单独导出 */
export function $createCustomLinkNode(
  options: Partial<CustomLinkPayload>,
  key?: NodeKey,
): CustomLinkNode {
  return $applyNodeReplacement(
    new CustomLinkNode({ type: 'node', ...options } as any, key),
  );
}
/** 浮动菜单判断状态 */
export function $isCustomLinkNode(
  node: LexicalNode | null | undefined,
): node is CustomLinkNode {
  return node instanceof CustomLinkNode;
}
type CommandParams = {
  method: 'create' | 'delete';
  payload?: Partial<CustomLinkPayload>;
  node?: CustomLinkNode;
};
/** 内部使用,需要注册 */
export const TOGGLE_CUSTOM_LINK_COMMAND: LexicalCommand<CommandParams> =
  createCommand('TOGGLE_CUSTOM_LINK_COMMAND');
/** 插件内内部使用 */
export function $toggleLink(
  attributes: CommandParams,
  injector: Injector,
  editor: LexicalEditor,
): void {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    if (attributes.method === 'delete') {
      const children = attributes.node!.getChildren();
      for (let i = 0; i < children.length; i++) {
        attributes.node!.insertBefore(children[i]);
      }
      attributes.node!.remove();
    }
    return;
  }
  const nodes = selection.extract();

  if (attributes.method === 'delete') {
    // Remove LinkNodes
    nodes.forEach((node) => {
      const parentLink = $findMatchingParent(node, (parent) =>
        $isCustomLinkNode(parent),
      );

      if (parentLink) {
        const children = parentLink.getChildren();

        for (let i = 0; i < children.length; i++) {
          parentLink.insertBefore(children[i]);
        }

        parentLink.remove();
      }
    });
  } else {
    // Add or merge LinkNodes
    if (nodes.length === 1) {
      const firstNode = nodes[0];
      // if the first node is a LinkNode or if its
      // parent is a LinkNode, we update the URL, target and rel.
      const linkNode = $getAncestor(firstNode, $isCustomLinkNode);
      if (linkNode !== null) {
        linkNode.update(attributes.payload!);
        return;
      }
    }

    let prevParent: ElementNode | CustomLinkNode | null = null;
    let linkNode: CustomLinkNode | null = null;

    nodes.forEach((node) => {
      const parent = node.getParent();

      if (
        parent === linkNode ||
        parent === null ||
        ($isElementNode(node) && !node.isInline())
      ) {
        return;
      }

      if ($isCustomLinkNode(parent)) {
        linkNode = parent;
        parent.update(attributes.payload!);
        return;
      }

      if (!parent.is(prevParent)) {
        prevParent = parent;
        linkNode = $createCustomLinkNode(attributes as any);

        if ($isCustomLinkNode(parent)) {
          if (node.getPreviousSibling() === null) {
            parent.insertBefore(linkNode);
          } else {
            parent.insertAfter(linkNode);
          }
        } else {
          node.insertBefore(linkNode);
        }
      }

      if ($isCustomLinkNode(node)) {
        if (node.is(linkNode)) {
          return;
        }
        if (linkNode !== null) {
          const children = node.getChildren();

          for (let i = 0; i < children.length; i++) {
            linkNode.append(children[i]);
          }
        }

        node.remove();
        return;
      }

      if (linkNode !== null) {
        linkNode.append(node);
        // let nextNode = linkNode.getNextSibling();
        // if (!nextNode) {
        //   linkNode.insertAfter($createTextNode(' '));
        // }
      }
    });
  }
}

function $getAncestor<NodeType extends LexicalNode = LexicalNode>(
  node: LexicalNode,
  predicate: (ancestor: LexicalNode) => ancestor is NodeType,
) {
  let parent = node;
  while (parent !== null && parent.getParent() !== null && !predicate(parent)) {
    parent = parent.getParentOrThrow();
  }
  return predicate(parent) ? parent : null;
}
