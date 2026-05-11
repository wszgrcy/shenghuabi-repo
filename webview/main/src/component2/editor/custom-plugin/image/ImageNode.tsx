import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import * as React from 'react';
import { CardImageComponent } from './component';
import type { JSX } from 'react';
import { NgOutletReact } from '@cyia/component/bridge';
import { deepClone } from '../../util/clone';
import { INJECTOR_CONTEXT } from '@cyia/ngx-bridge/react-outlet';
import { Injector } from '@angular/core';
import { CardEditorService } from '../../card-editor.service';

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement;
  const { alt: altText, src, width, height } = img;
  const node = $createImageNode({ altText, height, src, width });
  return { node };
}

export interface ImagePayload {
  altText?: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  caption?: string;
  showCaption?: boolean;
  src: string;
  usePercent?: boolean;
  /** 宽度绑定 */
  bingWidth?: boolean;
  float?: string;
}
export interface DeleteImagePayload {
  type: 'image';
  options: ImagePayload;
}
export type SerializedImageNode = Spread<
  {
    options: ImagePayload;
    key?: NodeKey;
  },
  SerializedLexicalNode
>;
function WrapEl(props: { component: any; props: any }) {
  const injector = React.useContext(INJECTOR_CONTEXT)!;
  const tempInjector = React.useMemo(
    () =>
      Injector.create({
        providers: injector.get(CardEditorService).pluginToken$$(),
        parent: injector,
      }),
    [],
  );
  return (
    <NgOutletReact
      component={props.component}
      props={props.props}
      options={{ elementInjector: tempInjector }}
    ></NgOutletReact>
  );
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  static override getType() {
    return 'image' as const;
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(node.options, node.getKey());
  }

  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    const node = $createImageNode(serializedNode.options, serializedNode.key);
    return node;
  }
  override exportJSON(): SerializedImageNode {
    return {
      options: this.options,
      type: 'image',
      version: 1,
    };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }
  override exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('alt', this.options.altText || '');
    element.loading = 'lazy';
    element.style.width = '100%';
    element.onerror = () => {};
    const wrapper = this.createDOM(editor._config);
    wrapper.appendChild(element);
    return {
      element: wrapper,
      after: (generatedElement) => {
        element.setAttribute('src', this.options.src);
        return generatedElement as any;
      },
    };
  }
  constructor(
    public options: ImagePayload,
    key?: NodeKey,
  ) {
    super(key);
  }

  // View
  #changeStyle(span: HTMLElement) {
    const payload = this.options;
    const unit = payload.usePercent ? '%' : 'px';
    if (payload.width) {
      span.style[`width`] = `${payload.width}${unit}`;
    } else {
      span.style[`width`] = ``;
    }
    if (payload.bingWidth) {
      if (payload.width) {
        span.style[`height`] = `${payload.width}${unit}`;
      } else if (payload.height) {
        span.style[`height`] = `${payload.height}${unit}`;
      } else {
        span.style[`height`] = ``;
      }
    } else {
      if (payload.height) {
        span.style[`height`] = `${payload.height}${unit}`;
      } else {
        span.style[`height`] = ``;
      }
    }
    span.style.float = payload.float || '';
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');

    const theme = config.theme;
    span.className = theme.image!;
    this.#changeStyle(span);
    return span;
  }

  override updateDOM(
    prevNode: ImageNode,
    dom: HTMLElement,
    config: EditorConfig,
  ): false {
    this.#changeStyle(dom);
    return false;
  }

  override decorate(): JSX.Element {
    return (
      <WrapEl
        component={CardImageComponent}
        props={{
          payload: this.options,
          id: this.getKey(),
        }}
      ></WrapEl>
    );
  }
  getOptions() {
    return deepClone(this.options);
  }
  update(payload: Partial<ImagePayload>): void {
    const writable = this.getWritable();
    writable.options = deepClone(writable.options);
    for (const key in payload) {
      const value = (payload as any)[key];
      if (typeof value === 'undefined') {
        continue;
      }
      (writable.options as any)[key] = value;
    }
  }
}

export function $createImageNode(
  options: ImagePayload,
  key?: NodeKey,
): ImageNode {
  return $applyNodeReplacement(new ImageNode(options, key));
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
