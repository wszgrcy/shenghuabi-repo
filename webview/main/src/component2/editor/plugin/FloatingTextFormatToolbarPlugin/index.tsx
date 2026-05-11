/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// import './index.css';

import { $isCodeHighlightNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  mergeRegister,
} from '@lexical/utils';
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  BaseSelection,
  COMMAND_PRIORITY_LOW,
  getDOMSelection,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

import { createPortal } from 'react-dom';

import { getDOMRangeRect } from '../../utils/getDOMRangeRect';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { setFloatingElemPosition } from '../../utils/setFloatingElemPosition';
import { $getSelectionStyleValueForProperty } from '@lexical/selection';
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import { EditorToolbarComponent } from './component/component';
import { NgOutletReact } from '@cyia/component/bridge';
import { Injector } from '@angular/core';
import { CardEditorService } from '../../card-editor.service';
const blockTypeToBlockName = {
  'list.bullet': 'Bulleted List',
  'list.check': 'Check List',
  'list.number': 'Numbered List',
  // code: 'Code Block',
  'heading.h1': 'Heading 1',
  'heading.h2': 'Heading 2',
  'heading.h3': 'Heading 3',
  'heading.h4': 'Heading 4',
  'heading.h5': 'Heading 5',
  'heading.h6': 'Heading 6',
  paragraph: 'Normal',
  quote: 'Quote',
};
function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  pluginData,
  isBold,
  isItalic,
  isUnderline,
  isCode,
  isStrikethrough,
  isSubscript,
  isSuperscript,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isBold: boolean;
  isCode: boolean;
  isItalic: boolean;
  pluginData: Record<string, any>;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  isUnderline: boolean;
}): JSX.Element {
  const [blockType, setBlockType] = useState('paragraph');
  const [selection, setSelection] = useState<BaseSelection>();
  const [fontColor, setFontColor] = useState<string>('#000');
  const [bgColor, setBgColor] = useState<string>('#fff');
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);

  // 拖动相关? 感觉可以优化,就是拖动时关闭工具栏就可以了
  function mouseMoveListener(e: MouseEvent) {
    if (
      popupCharStylesEditorRef?.current &&
      (e.buttons === 1 || e.buttons === 3)
    ) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'none') {
        const x = e.clientX;
        const y = e.clientY;
        const elementUnderMouse = document.elementFromPoint(x, y);

        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element => not a normal click, but probably a drag
          popupCharStylesEditorRef.current.style.pointerEvents = 'none';
        }
      }
    }
  }
  function mouseUpListener(e: MouseEvent) {
    if (popupCharStylesEditorRef?.current) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
        popupCharStylesEditorRef.current.style.pointerEvents = 'auto';
      }
    }
  }
  // 拖动相关
  useEffect(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener);

      return () => {
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('mouseup', mouseUpListener);
      };
    }
    return () => {};
  }, [popupCharStylesEditorRef]);
  /** 用于设置一些状态的 */
  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();
    if (selection) {
      setSelection(selection);
    }
    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    if (popupCharStylesEditorElem === null) {
      return;
    }
    const nativeSelection = getDOMSelection(editor._window);
    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      // 用于设置浮动范围
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

      setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
    }

    if ($isRangeSelection(selection)) {
      // 通过选中的部分读取颜色
      setFontColor(
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      {
        // 自建的转换,好像是从工具栏那里复制的
        // 就是找到父级,然后判断是什么类型的节点
        const anchorNode = selection.anchor.getNode();
        let element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : $findMatchingParent(anchorNode, (e) => {
                const parent = e.getParent();
                return parent !== null && $isRootOrShadowRoot(parent);
              });
        if (element === null) {
          element = anchorNode.getTopLevelElementOrThrow();
        }
        const elementKey = element.getKey();
        const elementDOM = editor.getElementByKey(elementKey);

        if (elementDOM !== null) {
          if ($isListNode(element)) {
            const parentList = $getNearestNodeOfType<ListNode>(
              anchorNode,
              ListNode,
            );
            const type = parentList
              ? parentList.getListType()
              : element.getListType();
            setBlockType(`list.${type}`);
          } else {
            const type = $isHeadingNode(element)
              ? `heading.${element.getTag()}`
              : element.getType();
            if (type in blockTypeToBlockName) {
              setBlockType(type as keyof typeof blockTypeToBlockName);
            }
          }
        }
      }
    }
  }, [editor, anchorElem]);

  useEffect(() => {
    // 根据尺寸变更和滚动.改变状态,主要是改浮动的
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar();
      });
    };

    window.addEventListener('resize', update);
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);

  useEffect(() => {
    // 内容变更会改变浮动范围
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateTextFormatFloatingToolbar]);

  // todo 应该放到指定位置

  // todo 缺少了清除样式
  // 可以写一个ngoutlet迁移整个工具栏
  // 锁定选中部分,防止出现输入后选择内容消失
  return (
    <div
      ref={popupCharStylesEditorRef}
      className="floating-text-format-popup mat-elevation-z2"
    >
      {editor.isEditable() && (
        <>
          <NgOutletReact
            component={EditorToolbarComponent}
            props={{
              selection: selection,
              blockType: blockType,
              editor: editor,
              status: {
                pluginData: pluginData,
                bold: isBold,
                italic: isItalic,
                underline: isUnderline,
                strikethrough: isStrikethrough,
                subscript: isSubscript,
                superscript: isSuperscript,
                code: isCode,
              },
              value: {
                color: fontColor,
                backgroundColor: bgColor,
              },
            }}
          ></NgOutletReact>
        </>
      )}
    </div>
  );
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  injector: Injector,
): JSX.Element | null {
  /** 控制是否开启浮动面板 */
  const [isText, setIsText] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [pluginData, setPluginData] = useState({});

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = getDOMSelection(editor._window);
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        // 处于选中状态但是不属于编辑器内选中的话就是false
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);
      // 都是默认的一些格式,这里没有高亮 highlight
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));
      // 自定义插件
      setPluginData(
        injector
          .get(CardEditorService)
          .plugins()
          .reduce(
            (obj, plugin) => {
              if (plugin.floatStatus) {
                obj[plugin.name] = plugin.floatStatus(node);
              }
              return obj;
            },
            {} as Record<string, any>,
          ),
      );
      // 不能是高亮节点
      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ''
      ) {
        setIsText($isTextNode(node) || $isParagraphNode(node));
      } else {
        setIsText(false);
      }
      // 如果没有内容那么取消
      const rawTextContent = selection.getTextContent().replace(/\n/g, '');
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false);
        return;
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
    );
  }, [editor, updatePopup]);

  if (!isText) {
    return null;
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      pluginData={pluginData}
      isBold={isBold}
      isItalic={isItalic}
      isStrikethrough={isStrikethrough}
      isSubscript={isSubscript}
      isSuperscript={isSuperscript}
      isUnderline={isUnderline}
      isCode={isCode}
    />,
    anchorElem,
  );
}

export function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
  injector,
}: {
  anchorElem?: HTMLElement;
  injector: Injector;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(editor, anchorElem, injector);
}
