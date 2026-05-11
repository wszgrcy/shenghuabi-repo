import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  Injector,
  Input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { $getNodeByKey, LexicalEditor } from 'lexical';
import {
  CustomLinkNode,
  CustomLinkPayload,
  TOGGLE_CUSTOM_LINK_COMMAND,
} from './linkNode';
import { Overlay, OverlayConfig, OverlayModule } from '@angular/cdk/overlay';
import { MatCardModule } from '@angular/material/card';
import { FormGroup } from '@angular/forms';
import { CardEditorService } from '../../card-editor.service';
import { NodeIconObject } from './const';
import { CustomLinkApiToken } from './token';
import { Config } from './config';
@Component({
  selector: 'custom-link',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatIconModule, OverlayModule, MatCardModule, MatButtonModule],
  styleUrl: './component.scss',
  // encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass$()',
  },
})
export class CustomLinkComponent {
  @Input({ required: true }) node!: CustomLinkNode;
  @Input({ required: true }) editor!: LexicalEditor;
  #api = inject(CustomLinkApiToken);

  #service = inject(CardEditorService);
  // node$$ = computed(() => {
  //   const id = this.payload$()!.nodeId;
  //   return untracked(() => this.#bridge.getNode(id));
  // });

  nodeType$$ = computed(() => {
    return this.payload$()?.type
      ? `icon-${NodeIconObject[this.payload$()!.type!]}`
      : `icon-help`;
  });
  dialog = inject(MatDialog);
  #injector = inject(Injector);
  model: Partial<CustomLinkPayload> = {};
  group = new FormGroup({});
  payload$ = signal<CustomLinkPayload | undefined>(undefined);
  overlay = inject(Overlay);
  elRef = inject(ElementRef);
  hostClass$ = computed(() => {
    return this.nodeType$$();
  });
  strategy = this.overlay
    .position()
    .flexibleConnectedTo(this.elRef)
    .withPositions([
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
      },
    ]);

  constructor() {
    const ref = effect(() => {
      const payload = this.payload$();
      if (payload) {
        if (this.isEmpty$()) {
          ref.destroy();
          this.#openConfig(payload);
        }
      }
    });
  }
  isEmpty$ = computed(() => {
    const payload = this.payload$();
    return !(
      (payload?.type === 'article' && payload.filePath) ||
      payload?.nodeId
    );
  });
  ngOnInit(): void {
    this.payload$.set(this.#getNode().options);
    this.#getNode().updateComp$.set((payload) => {
      this.payload$.set(payload);
    });
  }
  #getNode() {
    return this.editor.read(() => {
      return $getNodeByKey(this.node.getKey()) as CustomLinkNode;
    });
  }
  /**
   * 点击文字,直接跳转
   * 点击图标显示操作
   */
  focusNode = (payload: Partial<CustomLinkPayload>) => {
    if (!payload) {
      return false;
    }
    // 如果是只读.点击后应该直接移动
    if (payload.type === 'article') {
      if (payload.filePath) {
        this.#api.openArticle(payload.filePath);
        return true;
      }
    } else {
      const nodeId = payload.nodeId;
      if (nodeId) {
        this.#api.moveTo({ id: nodeId });
        return true;
      }
    }
    return false;
  };

  #overlayRef = this.overlay.create(
    new OverlayConfig({
      positionStrategy: this.strategy,
      hasBackdrop: true,
      backdropClass: 'config-backdrop',
    }),
  );
  @HostListener('click', ['$event'])
  elHover(event: MouseEvent) {
    if (this.editor.isEditable()) {
      this.#openConfig();
    } else {
      this.#service.closeFullscreen();
      this.focusNode(this.payload$()!);
    }
  }
  #configClose(data: { removeThis: boolean; isClose: boolean }) {
    this.#overlayRef.detach();
    if (data.removeThis) {
      this.editor.dispatchCommand(TOGGLE_CUSTOM_LINK_COMMAND, {
        method: 'delete',
        node: this.#getNode(),
      });
    } else if (data.isClose) {
      if (this.isEmpty$()) {
        this.editor.dispatchCommand(TOGGLE_CUSTOM_LINK_COMMAND, {
          method: 'delete',
          node: this.#getNode(),
        });
      }
    }
  }
  async #openConfig(options?: Partial<CustomLinkPayload>) {
    if (this.#overlayRef.hasAttached()) {
      return;
    }
    const model = options ?? this.payload$()! ?? {};

    const compRef = await this.#service.util()!.openPortal(
      Config,
      model,
      {
        deleteNode: () => {
          this.#configClose({ removeThis: true, isClose: false });
        },
        close: () => {
          this.#configClose({ removeThis: false, isClose: true });
        },
        moveTo: () => {
          const value = compRef.instance.getValue();
          this.editor.update(() => {
            ($getNodeByKey(this.node.getKey()) as CustomLinkNode).update(value);
          });
          // 保存
          this.#configClose({ removeThis: false, isClose: false });
          // 聚焦
          const a = this.focusNode(value);
          if (a) {
            this.#service.closeFullscreen();
          }
        },
        submit: () => {
          const value = compRef.instance.getValue();
          this.editor.update(() => {
            ($getNodeByKey(this.node.getKey()) as CustomLinkNode).update(value);
          });
          //保存?
          this.#configClose({ removeThis: false, isClose: false });
        },
        getCardNode: () => {
          return this.#api.getCardNode();
        },
      },
      this.#overlayRef,
      this.#injector,
    );

    this.#overlayRef.backdropClick().subscribe((e) => {
      this.#overlayRef.detach();
      if (this.isEmpty$()) {
        this.editor.dispatchCommand(TOGGLE_CUSTOM_LINK_COMMAND, {
          method: 'delete',
          node: this.#getNode(),
        });
      }
    });
  }
}
