import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  Provider,
  Renderer2,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { CustomNode } from '../type';
import { MatMenuModule } from '@angular/material/menu';
import { Overlay, OverlayModule, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { NodeBase } from '../node.base';
import { CardDataType, CardMindNode, CardMinSizeDefault } from '@bridge/share';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { defaultsDeep } from 'lodash-es';
import { insertScopeSheet } from '@fe/util/insert-style';
import { Clipboard } from '@angular/cdk/clipboard';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { getDefaults } from '@piying/view-angular-core';
import { SpanInputFCC } from '@cyia/component/core';
import {
  CustomLinkApiToken,
  editorToMarkdown,
  ImageApiToken,
  ImageLexicalPlugin,
  LinkLexicalPlugin,
  TextEditor,
  TextEditorUtil,
} from '@cyia/component/editor';
import { DialogConfigComponent } from './dialog-config/component';
import { PortalConfigComponent } from './portal-config/component';
import { MatDialog } from '@angular/material/dialog';
import { TrpcService } from '@fe/trpc';
import { getImgSrc } from '../../util/img-src';
@Component({
  selector: `card-editor`,
  standalone: true,
  imports: [
    MatIconModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTooltipModule,
    MatInputModule,
    FormsModule,
    MatMenuModule,

    OverlayModule,
    TextEditor,
    SpanInputFCC,
    PurePipe,
  ],
  providers: [],
  host: {},
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditorComponent extends NodeBase<CardDataType> {
  fullscreenTemplate =
    viewChild.required<TemplateRef<any>>('fullscreenTemplate');
  #overlay = inject(Overlay);
  #clipboard = inject(Clipboard);
  /** 不应该被主动调用 */
  dataChange = output<Partial<CustomNode['data']>>();
  inStore = input(false);
  #dialog = inject(MatDialog);
  #trpc = inject(TrpcService);
  util: TextEditorUtil = {
    openPortal: async (schema, model, context, overflowRef, injector) => {
      const portal = new ComponentPortal(
        PortalConfigComponent,
        undefined,
        injector,
      );
      const ref = overflowRef.attach(portal);
      ref.setInput('schema', schema);
      ref.setInput('model', model);
      ref.setInput('context', context);
      return ref;
    },
    openDialog: async (config, value, context, title, injector, options) => {
      const ref = this.#dialog.open(DialogConfigComponent, {
        data: {
          title: title,
          schema: config,
          context,
          value: value,
          bereforeClose: options?.beforeClose,
        },
        injector: injector,
      });
      return ref;
    },
    saveFile: async (input) => {
      return this.#trpc.client.mind.saveImageLocal.query({
        imgPath: input.filePath,
      });
    },
  } as TextEditorUtil;
  plugins = [
    new LinkLexicalPlugin(() => {
      return [
        {
          provide: CustomLinkApiToken,
          useValue: {
            openArticle: (filePath: any) => {
              return this.#trpc.client.mind.openArticle.query(filePath);
            },
            moveTo: (input: any) => {
              return this.bridge.moveTo(input);
            },
            getCardNode: () => {
              return (this.bridge.nodes() ?? [])!
                .filter(
                  (item) =>
                    item.type === 'card' &&
                    (item.data as CardDataType)['title'],
                )
                .map((item) => {
                  return {
                    label: (item.data as CardDataType)['title'],
                    value: item.id,
                  };
                });
            },
          },
        } as Provider,
      ];
    }),
    new ImageLexicalPlugin(() => {
      return [
        {
          provide: ImageApiToken,
          useValue: {
            convertSrc: (filePath: any) => {
              return getImgSrc(filePath);
            },
          },
        } as Provider,
      ];
    }),
  ];
  #dataChanged(data: Partial<CustomNode['data']>) {
    if (this.inStore()) {
      this.dataChange.emit(data);
    } else {
      this.bridge.patchDataOne(this.props().id, data);
    }
  }

  titleChange(title: string) {
    this.#dataChanged({ title: title });
  }
  async editorDataChange(value: CardDataType['value']) {
    if (value?.html) {
      const theme = this.props().data.config?.theme;
      if (theme) {
        value.html = `<link data-theme rel="stylesheet" href="${theme}">
        <div class="article-content">${value.html}</div>`;
      }
    }
    this.#dataChanged({ value });
  }
  #viewContainer = inject(ViewContainerRef);
  #overlayRef?: OverlayRef;
  fullScreen$ = signal(false);
  editorReadonly$ = computed(() => {
    return !this.props().selected || !!this.data$().status?.readonly;
  });

  themeClass$ = computed(() => {
    const themeName = this.data$().config?.theme;
    if (!themeName) {
      return Promise.resolve('');
    }
    return this.bridge.client.mind.nodeTheme.getOne
      .query(themeName)
      .then((themeContent) => {
        return insertScopeSheet(themeContent);
      });
  });
  /** 内部尺寸变更(确定时应该) */
  #editorResized$ = computed(() => {
    const id = this.props().id;
    return untracked(() => {
      const iNode = this.bridge.instance()!.getInternalNode(id);
      if (
        !iNode ||
        (iNode &&
          typeof iNode.width === 'undefined' &&
          typeof iNode.height === 'undefined')
      ) {
        return '';
      } else {
        return `editor-resized`;
      }
    });
  });
  #editorInteractionModeClass$ = computed(() => {
    const status = this.data$().status;
    return status?.editorInteractionMode === 'displayFirst'
      ? 'editor-display-first'
      : '';
  });
  // #statusClass$ = computed(() => {
  //   return `editor-open-${this.data$().status?.open || 'full'}`;
  // });
  /** 当前卡片内用 */
  compClass$ = computed(() => {
    return `${this.#editorResized$()} ${this.#editorInteractionModeClass$()}`;
  });
  /** 全屏用 */
  #panelClass = computed(() => {
    return this.themeClass$().then((item) => {
      return `${item} ${this.compClass$()} editor-panel-global`;
    });
  });
  disableToolkit$ = computed(() => {
    const status = this.data$().status;
    return { left: status?.editorInteractionMode === 'displayFirst' };
  });

  async openDialog() {
    const instance = new TemplatePortal(
      this.fullscreenTemplate(),
      this.#viewContainer,
    );
    this.#overlayRef = this.#overlay.create({
      width: '100vw',
      height: '100vh',
      panelClass: (await this.#panelClass()).split(' '),
    });
    this.#overlayRef.attach(instance);
    this.fullScreen$.set(true);
  }
  closeFullscreen() {
    this.#overlayRef?.detach();
    this.fullScreen$.set(false);
  }
  openStatus$ = computed(() => {
    return this.props().data.status?.open;
  });
  #elementRef = inject(ElementRef);
  #renderer = inject(Renderer2);
  constructor() {
    super();
    // todo 是否可以放到基类
    effect((cleanFn) => {
      const root = this.#elementRef.nativeElement;
      const stopFn = (e: WheelEvent) => e.stopImmediatePropagation();
      root.addEventListener('wheel', stopFn);
      cleanFn(() => root.removeEventListener('wheel', stopFn));
    });
    this.event$$
      .pipe(takeUntilDestroyed())
      .subscribe(({ method, parameters }) => {
        if (method === 'max') {
          this.openDialog();
        } else if (method === 'togglePanel') {
          let props;
          // 如果是文本节点转换或者初始化是title模式,那么没有宽度
          switch (parameters![0]) {
            case 'full': {
              const node = this.bridge.getNode(this.props().id);
              const minSize = getDefaults(CardMinSizeDefault);
              props = {
                id: this.props().id,
                // 如果不存在尺寸(text-node/直接title模式),那么使用默认模式
                //todo content=>full 谁大用谁
                //todo title=>content 私有或默认,宽度应该看最大的?
                width:
                  Math.max(
                    node?.measured?.width || 0,
                    this.props().data.__private?.fullSize?.width || 0,
                  ) || minSize.width,
                height:
                  Math.max(
                    node?.measured?.height || 0,
                    this.props().data.__private?.fullSize?.height || 0,
                  ) || minSize.height,
                data: {
                  ...this.props().data,
                  status: {
                    ...this.props().data.status,
                    open: parameters?.[0],
                  },
                  __private: {
                    ...this.props().data.__private,
                    openStatus: parameters?.[0],
                    fullSize: undefined,
                  },
                },
              } as Partial<CardMindNode>;
              break;
            }
            // title切换到content或者content到title怎么办
            case 'title':
            case 'content': {
              const openStatus = this.props().data.status?.open;
              if (openStatus === 'title' || openStatus === 'content') {
                props = {
                  id: this.props().id,
                  data: defaultsDeep(
                    {
                      status: { open: parameters?.[0] },
                    },
                    this.props().data,
                  ),
                };
              } else {
                props = {
                  id: this.props().id,
                  width: undefined,
                  height: undefined,
                  data: defaultsDeep(
                    {
                      status: { open: parameters?.[0] },
                      __private: {
                        fullSize: {
                          width: this.props().width,
                          height: this.props().height,
                        },
                      },
                    },
                    this.props().data,
                  ),
                } as Partial<CardMindNode>;
              }
              break;
            }
            default:
              throw '';
          }
          this.bridge.patchNode(props);
        } else if (method === 'setReadonly') {
          this.setReadonly(parameters![0]);
        } else if (method === 'setEditorInteractionMode') {
          this.bridge.patchDataOne(this.props().id, {
            status: {
              ...this.data$().status,
              editorInteractionMode: parameters![0],
            },
          });
        } else if (method === 'closeFullscreen') {
          this.closeFullscreen();
        } else if (method === 'copyMarkdown') {
          if (this.data$().value?.editorState) {
            const markdown = editorToMarkdown(
              this.data$().value?.editorState,
              this.plugins,
            );
            this.#clipboard.copy(markdown);
          }
        }
      });
  }
  #initedStyle = signal(false);
  styleRestore = () => {
    if (this.#initedStyle()) {
      setTimeout(() => {
        this.#renderer.removeStyle(this.#elementRef.nativeElement, 'width');
        this.#renderer.removeStyle(this.#elementRef.nativeElement, 'height');
      }, 100);
    }
    return 0;
  };
  ngOnInit(): void {
    const node = this.bridge.instance()!.getInternalNode(this.id$());
    if (node && node.measured.height && node.measured.width) {
      this.#renderer.setStyle(
        this.#elementRef.nativeElement,
        'width',
        node.measured.width + 'px',
      );
      this.#renderer.setStyle(
        this.#elementRef.nativeElement,
        'height',
        node.measured.height + 'px',
      );
      this.#initedStyle.set(true);
    }
  }

  setReadonly(isReadonly: boolean) {
    this.bridge.patchDataOne(this.props().id, {
      status: {
        ...this.data$().status,
        readonly: isReadonly,
      },
    });
  }
  eventChanged(event: { method: string; parameters?: any[] }) {
    if (event.method === 'closeFullscreen') {
      this.closeFullscreen();
    }
  }
}
