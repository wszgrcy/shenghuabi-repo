import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ThemeDefine } from './theme';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import React, { useEffect, useMemo, useState } from 'react';
import { FloatingTextFormatToolbarPlugin } from './plugin/FloatingTextFormatToolbarPlugin';
import { Injector } from '@angular/core';
import { CardEditorService } from './card-editor.service';
import { SaveRestorePlugin } from './plugin/save-restore';
import DraggableBlockPlugin from './plugin/DraggableBlockPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import MarkdownPlugin from './plugin/MarkdownShortcutPlugin';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import TableCellResizer from './plugin/TableCellResizer/index';
import TableHoverActionsPlugin from './plugin/TableHoverActionsPlugin/index';
import TableActionMenuPlugin from './plugin/TableActionMenuPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import ComponentPickerMenuPlugin from './plugin/ComponentPickerPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import CodeHighlightPlugin from './plugin/CodeHighlightPlugin';
import CodeActionMenuPlugin from './plugin/CodeActionMenuPlugin';
import { DISABLE_TOOLKIT } from './const';

export function PlaceHolder() {
  return (
    <>
      <div className="editor-placeholder">请输入</div>
    </>
  );
}

export function ComponentMain(injector: Injector): () => React.ReactElement {
  const service = injector.get(CardEditorService);
  return () => {
    return (
      <>
        <LexicalComposer
          initialConfig={{
            editorState: service.initEditorState,
            namespace: 'editor',
            nodes: [
              ListNode,
              ListItemNode,
              HeadingNode,
              QuoteNode,
              CodeHighlightNode,
              CodeNode,
              TableCellNode,
              TableNode,
              TableRowNode,
              HorizontalRuleNode,
              ...service.plugins().map((item) => item.node),
            ],
            // Handling of errors during update
            onError(error: Error) {
              throw error;
            },
            // The editor theme
            theme: ThemeDefine,
          }}
        >
          <Editor injector={injector}></Editor>
        </LexicalComposer>
      </>
    );
  };
}
export function Editor({ injector }: { injector: Injector }) {
  const [toolkitDisabled, setToolKitDisabled] = useState<{ left?: boolean }>();
  const isEditable = useLexicalEditable();
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);
  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
      injector.get(CardEditorService).floatingAnchor.set(_floatingAnchorElem);
    }
  };
  const plugins = useMemo(
    () =>
      injector
        .get(CardEditorService)
        .plugins()
        .filter((item) => !!item.registerPlugin)
        .map((item) => item.registerPlugin!()),
    [],
  );

  const [editor] = useLexicalComposerContext();
  // link的注入
  useEffect(() => {
    const cmdDispose2 = editor.registerCommand<any>(
      DISABLE_TOOLKIT,
      (payload) => {
        setToolKitDisabled(payload);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
    return () => {
      cmdDispose2();
    };
  }, [editor]);
  return (
    <>
      {/* 缩进.通用 */}
      <TabIndentationPlugin></TabIndentationPlugin>
      {/* 列表.通用 */}
      <ListPlugin />
      <CheckListPlugin></CheckListPlugin>
      {/* 主编辑器.通用 */}
      <div className="editor-container" ref={onRef}>
        <RichTextPlugin
          contentEditable={
            <div className={`editor-scroller custom-scrollbar`}>
              <ContentEditable className="editor-content article-content" />
            </div>
          }
          placeholder={<PlaceHolder></PlaceHolder>}
          ErrorBoundary={LexicalErrorBoundary}
        ></RichTextPlugin>
      </div>
      {/* 代码高亮.卡片使用 */}
      <CodeHighlightPlugin />
      {/* 保存恢复,通用 */}
      <SaveRestorePlugin injector={injector}></SaveRestorePlugin>
      {/* markdown 通用 */}
      <MarkdownPlugin injector={injector}></MarkdownPlugin>
      {/* 表格.专用 */}
      <TablePlugin hasCellMerge={true} hasCellBackgroundColor={true} />
      <TableCellResizer></TableCellResizer>
      <TableHoverActionsPlugin></TableHoverActionsPlugin>

      {/* '/'命令 */}
      <ComponentPickerMenuPlugin
        injector={injector}
      ></ComponentPickerMenuPlugin>
      <HorizontalRulePlugin />
      {plugins.map((Plugin, index) => (
        <Plugin key={index} injector={injector}></Plugin>
      ))}
      {/* text去掉 */}
      {floatingAnchorElem && isEditable && !toolkitDisabled?.left ? (
        <DraggableBlockPlugin
          anchorElem={floatingAnchorElem}
          injector={injector}
        />
      ) : null}
      {floatingAnchorElem && isEditable && (
        <>
          <TableActionMenuPlugin
            anchorElem={floatingAnchorElem}
            cellMerge={true}
          ></TableActionMenuPlugin>
          <CodeActionMenuPlugin anchorElem={floatingAnchorElem} />

          <FloatingTextFormatToolbarPlugin
            anchorElem={floatingAnchorElem}
            injector={injector}
          />
        </>
      )}
    </>
  );
}
