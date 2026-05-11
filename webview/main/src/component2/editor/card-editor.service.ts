import {
  ApplicationRef,
  computed,
  createComponent,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injectable,
  Injector,
  NgZone,
  OutputEmitterRef,
  Signal,
  signal,
} from '@angular/core';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  EditorState,
  LexicalEditor,
  LexicalNode,
} from 'lexical';

import { BaseSyntheticEvent } from 'react';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { MatDialog } from '@angular/material/dialog';
import { INSERT_NEW_LINE } from './const';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
// import { TrpcService } from '@fe/trpc';
// import { BridgeService } from '../../../service';
import { $createCodeNode } from '@lexical/code';
import { TextEditorUtil } from './token';
import { LexicalPlugin } from './lexical-plugin';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { firstValueFrom } from 'rxjs';
import { INSERT_FORM_CONFIG } from './custom-plugin/table/config';

const numberToChinese = ['一', '二', '三', '四', '五', '六'];
const formatParagraph = (editor: LexicalEditor) => {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      $setBlocksType(selection, () => $createParagraphNode());
    }
  });
};
export interface NODE_ITEM_META {
  label: string;
  icon?: string;
  type: string;
  data: any;
  textIcon?: { label: string; className: string };
  disable?: {
    insertAfter?: boolean;
    convert?: boolean;
    trigger?: boolean;
  };
  on: {
    select?: (editor: LexicalEditor, injector: Injector) => any;
    insertAfter?: (editor: LexicalEditor, injector: Injector) => any;
    convert?: (
      options: { blockType: string; editor: LexicalEditor },
      injector: Injector,
    ) => any;
  };
  keywords: string[];
}
export interface NODE_ITEM extends NODE_ITEM_META {
  click: (editor: LexicalEditor) => any;
}
@Injectable()
export class CardEditorService {
  dialog = inject(MatDialog);
  contextMenu = signal<ElementRef<HTMLElement> | undefined>(undefined);
  /** SaveRestorePlugin 值变更 */
  valueChange = signal<EditorState | undefined>(undefined);
  /** SaveRestorePlugin 赋值.
   * 需要检查使用它时的时机
   */
  editor = signal<LexicalEditor | undefined>(undefined);
  /** .editor 元素 */
  floatingAnchor = signal<HTMLElement | undefined | null>(undefined);
  elementRef!: ElementRef<HTMLElement>;
  /** 左侧插入时最近的元素 */
  targetLineElement = signal<LexicalNode | undefined>(undefined);
  initEditorState?: (editor: LexicalEditor) => void;
  util!: Signal<TextEditorUtil | undefined>;
  plugins!: Signal<LexicalPlugin[]>;
  #injector = inject(Injector);
  eventChange!: OutputEmitterRef<{
    method: string;
    parameters?: any[];
  }>;

  /** 可转换列表 */
  readonly #LINE_LEVEL_NODE_LIST: NODE_ITEM_META[] = [
    {
      icon: 'notes',
      label: `段落`,
      type: 'paragraph',
      keywords: ['normal', 'paragraph', 'p', 'text'],
      data: {},
      on: {
        select: (editor: LexicalEditor) => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createParagraphNode());
            }
          });
        },
        insertAfter: () => {
          this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            type: 'paragraph',
            data: {},
          });
        },
        convert: ({ blockType, editor }) => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createParagraphNode());
            }
          });
        },
      },
    },
    ...([1, 2, 3, 4, 5, 6] as const).map((index, i) => {
      const tag = `h${index}` as const;
      return {
        label: `${numberToChinese[i]}级标题`,
        textIcon: {
          label: `H${index}`,
          className: `text-[1em] w-[24px] h-[24px] mr-[12px]`,
        },
        type: `heading.${tag}`,
        keywords: ['heading', 'header', tag],
        data: {
          type: tag,
        },
        on: {
          select: (editor) => {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(tag));
              }
            });
          },
          insertAfter: () => {
            this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
              type: 'heading',
              data: { type: tag },
            });
          },
          convert: ({ editor, blockType }) => {
            if (blockType !== tag) {
              editor.update(() => {
                const selection = $getSelection();
                $setBlocksType(selection, () => $createHeadingNode(tag));
              });
            }
          },
        },
      } as NODE_ITEM_META;
    }),
    {
      icon: 'format_list_bulleted',
      label: `无序列表`,
      type: 'list.bullet',
      keywords: ['bulleted list', 'unordered list', 'ul'],

      data: { type: 'bullet' },
      on: {
        select: (editor) => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        },
        insertAfter: () => {
          this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            type: 'list',
            data: { type: 'bullet' },
          });
        },
        convert: ({ editor, blockType }) => {
          if (blockType !== 'list.bullet') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
            formatParagraph(editor);
          }
        },
      },
    },
    {
      icon: 'format_list_numbered',
      label: `有序列表`,
      type: 'list.number',
      keywords: ['numbered list', 'ordered list', 'ol'],

      data: { type: 'number' },
      on: {
        select: (editor) => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        },
        insertAfter: () => {
          this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            type: 'list',
            data: { type: 'number' },
          });
        },
        convert: ({ editor, blockType }) => {
          if (blockType !== 'list.number') {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          } else {
            formatParagraph(editor);
          }
        },
      },
    },
    {
      icon: 'check_box',
      label: `清单列表`,
      type: 'list.check',
      keywords: ['check list', 'todo list'],

      data: { type: 'check' },
      on: {
        select: (editor) => {
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
        },
        insertAfter: () => {
          this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            type: 'list',
            data: { type: 'check' },
          });
        },
        convert: ({ editor, blockType }) => {
          if (blockType !== 'list.check') {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
          } else {
            formatParagraph(editor);
          }
        },
      },
    },
    {
      icon: 'format_quote',
      label: `引用`,
      type: 'quote',
      keywords: ['block quote'],

      data: {},
      disable: {
        insertAfter: true,
      },
      on: {
        select: (editor) => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createQuoteNode());
            }
          });
        },

        convert: ({ editor, blockType }) => {
          if (blockType !== 'quote') {
            editor.update(() => {
              const selection = $getSelection();
              $setBlocksType(selection, () => $createQuoteNode());
            });
          }
        },
      },
    },
    {
      icon: 'grid_on',
      label: `表格`,
      type: 'table',
      keywords: ['table', 'grid', 'spreadsheet', 'rows', 'columns'],
      disable: {
        convert: true,
      },
      data: {},
      on: {
        select: async (editor) => {
          const util = this.util()!;
          const ref = await util.openDialog(
            INSERT_FORM_CONFIG,
            {},
            {},
            '插入表格',
            this.#injector,
          );

          const result = await firstValueFrom(ref.afterClosed());
          if (!result) {
            return;
          }
          editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            columns: result.columns,
            rows: result.rows,
          });
        },
        insertAfter: async () => {
          const util = this.util()!;
          const ref = await util.openDialog(
            INSERT_FORM_CONFIG,
            {},
            {},
            '插入表格',
            this.#injector,
          );

          const result = await firstValueFrom(ref.afterClosed());
          if (!result) {
            return;
          }
          this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            type: 'table',
            data: result,
          });
        },
      },
    },
    {
      icon: 'horizontal_rule',
      label: `分隔线`,
      type: 'divider',
      keywords: ['horizontal rule', 'divider', 'hr'],
      disable: {
        convert: true,
      },
      data: {},
      on: {
        select: async (editor) => {
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
        },
        insertAfter: async () => {
          this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            type: 'divider',
            data: {},
          });
        },
      },
    },

    {
      icon: 'code',
      label: `代码`,
      type: 'code',
      keywords: ['code'],
      data: {},
      disable: {},
      on: {
        select: (editor) => {
          editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              if (selection.isCollapsed()) {
                $setBlocksType(selection, () => $createCodeNode());
              } else {
                // Will this ever happen?
                const textContent = selection.getTextContent();
                const codeNode = $createCodeNode();
                selection.insertNodes([codeNode]);
                selection.insertRawText(textContent);
              }
            }
          });
        },
        insertAfter: () => {
          this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            type: 'code',
            data: { type: 'check' },
          });
        },
        convert: ({ editor, blockType }) => {
          if (blockType !== 'code') {
            editor.update(() => {
              let selection = $getSelection();
              if (selection !== null) {
                if (selection.isCollapsed()) {
                  $setBlocksType(selection, () => $createCodeNode());
                } else {
                  const textContent = selection.getTextContent();
                  const codeNode = $createCodeNode();
                  selection.insertNodes([codeNode]);
                  selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    selection.insertRawText(textContent);
                  }
                }
              }
            });
          }
        },
      },
    },
    // {
    //   icon: 'link',
    //   label: `链接`,
    //   type: 'custom-link',
    //   keywords: ['link'],
    //   disable: {
    //     insertAfter: true,
    //   },
    //   data: {},
    //   on: {
    //   },
    // },
  ];
  #pluginInsertList$$ = computed(() => {
    return this.plugins().flatMap((plugin) =>
      plugin.insertTool ? plugin.insertTool() : [],
    );
  });
  #InsertTools$$ = computed(() => {
    return [...this.#LINE_LEVEL_NODE_LIST, ...this.#pluginInsertList$$()];
  });
  // openConfig(
  //   title: string,
  //   fields:
  //     | FormlyFieldConfig[]
  //     | ((bridge: BridgeService) => FormlyFieldConfig[]),
  // ) {
  //   return this.dialog.open(NewConfigComponent, {
  //     data: {
  //       title: title,
  //       fields: typeof fields === 'function' ? fields(this.#bridge) : fields,
  //     },
  //   });
  // }
  openContextMenu(
    event: BaseSyntheticEvent<PointerEvent>,
    closetNode: LexicalNode,
  ) {
    this.targetLineElement.set(closetNode);
    const contextMenu = this.contextMenu()!.nativeElement;
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    contextMenu.style.left = event.nativeEvent.pageX - rect.x + 'px';
    contextMenu.style.top = event.nativeEvent.pageY - rect.y + 'px';
    // 小窗口下可能还是有点异常，不过偏移很小。不要紧
    contextMenu.click();
  }

  listen() {}
  /** 使用'/'来显示的命令 */
  triggerList$ = computed(() => {
    return this.#InsertTools$$()
      .filter((item) => {
        return !item.disable?.trigger;
      })
      .map((item) => {
        return {
          ...item,
          click: () => item.on.select!(this.editor()!, this.#injector),
        };
      });
  });
  /** 插入列表,插入新的一行 */
  insertList$ = computed(() => {
    return this.#InsertTools$$()
      .filter((item) => {
        return !item.disable?.insertAfter;
      })
      .map((item) => {
        return {
          ...item,
          click: () => item.on.insertAfter!(this.editor()!, this.#injector),
        };
      });
  });
  convertList$ = computed(() => {
    return this.#InsertTools$$()
      .filter((item) => {
        return !item.disable?.convert;
      })
      .map((item) => {
        return { ...item, click: item.on.convert };
      });
  });

  appRef!: ApplicationRef;
  envInjector!: EnvironmentInjector;
  pluginToken$$ = computed(() => {
    return this.plugins().flatMap((item) =>
      item.registerProviders ? item.registerProviders() : [],
    );
  });
  createComponent(component: any, inputs?: any, element?: HTMLElement) {
    const injector = Injector.create({
      providers: this.pluginToken$$(),
      parent: this.#injector,
    });
    const zone = this.envInjector.get(NgZone);
    return zone.run(() => {
      const ref = createComponent(component, {
        environmentInjector: this.envInjector,
        elementInjector: injector,
        hostElement: element,
      });
      this.appRef.attachView(ref.hostView);
      if (inputs) {
        for (const key in inputs) {
          ref.setInput(key, inputs[key]);
        }
      }
      return ref;
    });
  }
  closeFullscreen() {
    this.eventChange.emit({ method: 'closeFullscreen' });
  }
}
