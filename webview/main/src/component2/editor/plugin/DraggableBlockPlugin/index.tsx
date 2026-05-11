/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useCallback, useRef, useState } from 'react';
import { CardEditorService } from '../../card-editor.service';
import { Injector } from '@angular/core';
import type { JSX } from 'react';
import { $getNearestNodeFromDOMNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export default function DraggableBlockPlugin({
  anchorElem = document.body,
  injector,
}: {
  anchorElem?: HTMLElement;
  injector: Injector;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [draggableElement, setDraggableElement] = useState<HTMLElement | null>(
    null,
  );

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef as any}
      targetLineRef={targetLineRef as any}
      menuComponent={
        <div ref={menuRef} className="flex draggable-wrapper">
          <div
            className="material-icons icon draggable-block-menu"
            draggable="false"
            onClick={useCallback(
              (e: any) => {
                if (!draggableElement || !editor) {
                  return;
                }
                const node = editor.read(() => {
                  const node = $getNearestNodeFromDOMNode(draggableElement);
                  return node;
                });
                if (!node) {
                  return;
                }
                injector.get(CardEditorService).openContextMenu(e, node);
              },
              [draggableElement],
            )}
          >
            add
          </div>
          <div className="material-icons icon draggable-block-menu flex-1">
            drag_indicator
          </div>
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
      onElementChanged={setDraggableElement}
    />
  );
}
