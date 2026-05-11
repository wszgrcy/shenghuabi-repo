import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  computed,
  effect,
  ElementRef,
  EnvironmentInjector,
  forwardRef,
  inject,
  Injector,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';

import { filter } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { deepEqual } from 'fast-equals';

import { CardEditorService } from './card-editor.service';
import { MatMenuModule } from '@angular/material/menu';

/** 编辑器导入 */

import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';
import { ComponentMain } from './react-component';
import { toObservable } from '@angular/core/rxjs-interop';
import { INSERT_NEW_LINE, DISABLE_TOOLKIT } from './const';
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  LexicalNode,
  PASTE_COMMAND,
} from 'lexical';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';
import {
  $convertToMarkdownString,
  $convertFromMarkdownString,
} from '@lexical/markdown';
import { $createTableNodeWithDimensions } from '@lexical/table';

import { $createHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $createCodeNode } from '@lexical/code';
import { INJECT_NG_COMPONENT } from './command';
import { isMarkdown } from './utils/is-markdown';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { EditorData } from './type';
import { LexicalPlugin } from './lexical-plugin';
import { TextEditorUtil } from './token';
import { MarkdownService } from './markdown.service';
import { BaseControl } from '@piying/view-angular';
@Component({
  selector: `text-editor`,
  standalone: true,
  imports: [MatIconModule, MatMenuModule, ReactOutlet],
  providers: [
    CardEditorService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextEditor),
      multi: true,
    },
    MarkdownService,
  ],
  host: { '[class]': `'nodrag '+editorReadonlyClass$()` },
  templateUrl: './component.html',
  styleUrls: ['./component.scss', './main.scss', './default-theme.scss'],
  // encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEditor extends BaseControl<EditorData | undefined> {
  editorReadonly = input<boolean>(false);
  disableToolkit = input<{ left: boolean }>();
  plugins = input<LexicalPlugin[]>([]);
  util = input<TextEditorUtil>();
  #elementRef = inject(ElementRef);
  contextMenu = viewChild<ElementRef<HTMLElement>>('contextMenu');
  #injector = inject(Injector);
  ComponentMain = ComponentMain(this.#injector);
  service = inject(CardEditorService);
  editorReadonlyClass$ = computed(() => {
    return this.editorReadonly() ? 'editor-readonly' : '';
  });
  eventChange = output<{ method: string; parameters?: any[] }>();
  #mardown = inject(MarkdownService);
  #MD_TRANSFORMERS = (root?: string) => this.#mardown.getTransformers(root);
  #appRef = inject(ApplicationRef);
  #envInjector = inject(EnvironmentInjector);
  constructor() {
    super();
    this.#registerElement();
    this.service.appRef = this.#appRef;
    this.service.envInjector = this.#envInjector;
    this.service.eventChange = this.eventChange;
    this.service.plugins = this.plugins;
    this.service.util = this.util;
    this.#listenEvent();

    // 设置只读
    effect(() => {
      const editor = this.service.editor();
      if (!editor) {
        return;
      }
      editor.setEditable(!this.editorReadonly());
    });
    // 工具栏禁用
    effect(() => {
      const editor = this.service.editor();
      if (!editor) {
        return;
      }
      editor.dispatchCommand(DISABLE_TOOLKIT, this.disableToolkit());
    });
    // 值变更
    toObservable(this.service.valueChange)
      .pipe(filter(Boolean))
      .subscribe((value) => {
        const editorState = value.toJSON();
        const lastValue = this.value$();
        const currentValue = {
          editorState: editorState,
          html: this.service
            .editor()!
            .read(() => $generateHtmlFromNodes(this.service.editor()!)),
        };

        if (!this.#equalCompare || !deepEqual(lastValue, currentValue)) {
          this.#equalCompare = false;
          this.value$.set(currentValue);
          this.valueChange(this.value$());
        }
      });
    // 上下文菜单测试
    effect(() => {
      const menu = this.contextMenu();
      untracked(() => {
        this.service.contextMenu.set(menu);
      });
    });
    this.service.elementRef = this.#elementRef;
  }
  #registerElement() {
    // 未来如果内联shadowdom慢再替换回来
    // let linkSelector = reflectComponentType(CustomLinkComponent)!.selector;
    // let result = customElements.get(linkSelector);
    // if (!result) {
    //   const element = createCustomElement(CustomLinkComponent, {
    //     injector: this.#injector,
    //   });
    //   customElements.define(linkSelector, element);
    // }
  }
  async ngOnInit() {
    this.service.initEditorState = (editor) => {
      this.service.editor.set(editor);
      this.#linkComponentRegistry();
      if (this.value$()?.editorState) {
        editor.setEditorState(
          editor.parseEditorState(this.value$()!.editorState),
        );
      } else if (this.value$()?.markdown) {
        $convertFromMarkdownString(
          this.value$()?.markdown!,
          this.#MD_TRANSFORMERS(this.value$()?.markdownRoot),
        );
      }
    };
    this.service.listen();
    // 新建命令注册
    // 为了拖动透明化
    // 在某个元素上无效化,移除后有效化
    effect(
      (cleanFn) => {
        const editor = this.service.editor();
        if (!editor) {
          return;
        }
        const dispose1 = editor.registerCommand<{
          type: string;
          data: { type?: string; rows?: number; columns?: number };
          node: LexicalNode;
        }>(
          INSERT_NEW_LINE,
          (payload) => {
            const data = this.service.targetLineElement();
            if (!data) {
              return false;
            }
            let instance;
            if (payload.type === 'list') {
              instance = $createListNode(payload.data.type! as any);
              instance.append($createListItemNode());
            } else if (payload.type === 'paragraph') {
              instance = $createParagraphNode();
            } else if (payload.type === 'heading') {
              instance = $createHeadingNode(payload.data.type! as any);
            } else if (payload.type === 'divider') {
              instance = $createHorizontalRuleNode();
              data.insertAfter(instance!);
              return true;
            } else if (payload.type === 'code') {
              instance = $createCodeNode();
              data.insertAfter(instance!);
              return true;
            } else if (payload.type === 'table') {
              instance = $createTableNodeWithDimensions(
                payload.data.rows!,
                payload.data.columns!,
              );
              data.insertAfter(instance!);
              const firstDescendant = instance!.getFirstDescendant();
              if ($isTextNode(firstDescendant)) {
                firstDescendant.select();
              }
              return true;
            }

            if (payload.type !== 'table') {
              instance!.select();
              data.insertAfter(instance!);
            }

            return true;
          },
          COMMAND_PRIORITY_EDITOR,
        );
        // 粘贴解析 md
        const dispose2 = editor.registerCommand(
          PASTE_COMMAND,
          (event, editor) => {
            if (event instanceof ClipboardEvent && event.clipboardData) {
              // 如果是编辑器内的复制粘贴,正常处理
              if (
                event.clipboardData.types.includes(
                  'application/x-lexical-editor',
                ) ||
                !event.clipboardData.types.includes('text/plain')
              ) {
                return false;
              }
              const data = event.clipboardData.getData('text/plain');
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) {
                return false;
              }
              if (!selection.isCollapsed()) {
                // 范围选中不处理
                return false;
              }

              const mdMode = isMarkdown(data);
              const node = selection.getNodes()[0];
              // 目前只能处理所在行为空行
              if (mdMode.element) {
                // 插入模式,并且为元素节点
                if ($isElementNode(node)) {
                  $convertFromMarkdownString(
                    data,
                    this.#MD_TRANSFORMERS(),
                    node,
                  );
                  node.replace(node.getFirstChild()!);
                  return true;
                }
                // 插入模式,但是非元素节点
                return false;
              } else if (mdMode.oneLine) {
                if ($isElementNode(node)) {
                  $convertFromMarkdownString(
                    data,
                    this.#MD_TRANSFORMERS(),
                    node,
                  );
                  node.replace(node.getFirstChild()!);
                  return true;
                } else {
                  // event.preventDefault();
                  // let parent = node.getParent();
                  // if (parent && $isElementNode(parent)) {
                  //   let tmpNode = $createParagraphNode();
                  //   parent.insertAfter(tmpNode);
                  //   $convertFromMarkdownString(
                  //     data,
                  //     this.#MD_TRANSFORMERS(),
                  //     tmpNode,
                  //   );
                  //   tmpNode.remove();
                  //   tmpNode
                  //     .getChildren()
                  //     .reverse()
                  //     .forEach((item) => {
                  //       if ($isParagraphNode(item)) {
                  //         selection.insertNodes(
                  //           item.getChildren(),
                  //           // .reverse()
                  //         );
                  //         // item
                  //         //   .getChildren()
                  //         //   .reverse()
                  //         //   .forEach((item) => {
                  //         //     node.insertAfter(item);
                  //         //   });
                  //       } else {
                  //         // node.insertAfter(item);
                  //       }
                  //     });
                  //   // node.selectEnd();
                  // }

                  // return true;
                  return false;
                  // 焦点位于文本中,未选中
                }

                return false;
              } else {
                // 普通文本
                return false;
              }

              // 非范围选中
            }

            return false;
          },
          2,
        );

        cleanFn(() => {
          dispose1();
          dispose2();
        });
      },
      { injector: this.#injector },
    );
  }

  #listenEvent() {}

  #linkComponentRegistry() {
    const nodeMap = new Map<string, ComponentRef<any>>();
    const service = this.service;
    const editor = service.editor()!;
    const cmdDispose = editor.registerCommand(
      INJECT_NG_COMPONENT,
      (payload) => {
        const ref = service.createComponent(
          payload.component,
          payload.inputs,
          payload.element,
        );
        nodeMap.set(payload.inputs.node.getKey(), ref);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
    const disposeList: (() => void)[] = [];
    const plugins = this.plugins();
    if (plugins) {
      // 销毁组件,不知道有没有自动小孩方法
      for (const plugin of plugins) {
        disposeList.push(
          editor.registerMutationListener(plugin.node, (nodeMutations) => {
            for (const [nodeKey, mutation] of nodeMutations) {
              if (mutation === 'destroyed') {
                nodeMap.get(nodeKey)?.destroy();
                nodeMap.delete(nodeKey);
              }
            }
          }),
        );
      }
    }
    return () => {
      cmdDispose();
      disposeList.forEach((fn) => fn());
    };
  }
  /** 产生外部输入时,需要发射时比较一下看看是否想等,用于撤销 */
  #equalCompare = false;
  override writeValue(obj: EditorData): void {
    this.#equalCompare = true;
    super.writeValue(obj);
    this.#updateEditor(this.value$());
  }

  #updateEditor(value: EditorData | undefined) {
    const editor = this.service.editor();
    if (!editor) {
      return;
    }
    if (value?.editorState) {
      const state = editor.parseEditorState(value.editorState);
      editor.setEditorState(state);
    } else if (value?.markdown) {
      if (
        deepEqual(
          value?.markdown,
          this.service.editor()!.read(() => {
            const markdown = $convertToMarkdownString(
              this.#mardown.getTransformers(),
            );
            return markdown;
          }),
        )
      ) {
        return;
      }
      this.service.editor()!.update(() => {
        $convertFromMarkdownString(
          value?.markdown!,
          this.#MD_TRANSFORMERS(value?.markdownRoot),
        );
      });
    }
  }
}
