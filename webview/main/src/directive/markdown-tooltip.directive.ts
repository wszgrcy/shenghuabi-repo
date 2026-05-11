import {
  ConnectedPosition,
  Overlay,
  OverlayConfig,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  inject,
  Injector,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarkdownComponent } from '@fe/component/markdown-tooltip/component';
import { isNumber } from 'lodash-es';
import { fromEvent } from 'rxjs';
const PositionObj = {
  s: 'start',
  c: 'center',
  e: 'end',
  b: 'bottom',
  t: 'top',
};
function positionMap(input: string | undefined) {
  if (!input) {
    return [];
  }
  const list = input.split('');
  return [
    {
      originX: (PositionObj as any)[list[0]],
      originY: (PositionObj as any)[list[1]],
      overlayX: (PositionObj as any)[list[2]],
      overlayY: (PositionObj as any)[list[3]],
    } as any as ConnectedPosition,
  ];
}
@Directive({
  selector: '[shMarkdownTooltip]',
  standalone: true,
})
export class ShMarkdownTooltipDirective {
  shMarkdownTooltip = input.required<string>();
  shMarkdownTooltipShowDelay = input(150);
  shMarkdownTooltipCloseDelay = input(100);
  // 假设输入为一次性的
  shMarkdownTooltipPosition = input<string>();
  #closeTimeoutId?: any;
  #showTimeoutId?: any;
  #destroyRef = inject(DestroyRef);
  @HostListener('mouseenter') hover() {
    if (!this.shMarkdownTooltip()) {
      return;
    }
    this.#clearCloseDelay();
    this.#attachOverlay();
  }
  @HostListener('mouseleave') blur() {
    this.#closeOverlay();
  }
  #attachOverlay() {
    if (this.#overlayRef().hasAttached()) {
      return;
    }
    if (!isNumber(this.#showTimeoutId)) {
      this.#showTimeoutId = setTimeout(() => {
        const componentRef = this.#overlayRef().attach(this.#portal);
        componentRef.setInput('content', this.shMarkdownTooltip());
        fromEvent<MouseEvent>(componentRef.location.nativeElement, 'mouseenter')
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe(() => this.#clearCloseDelay());
        fromEvent<MouseEvent>(componentRef.location.nativeElement, 'mouseleave')
          .pipe(takeUntilDestroyed(this.#destroyRef))
          .subscribe(() => this.#closeOverlay());
        this.#showTimeoutId = undefined;
      }, this.shMarkdownTooltipShowDelay());
    }
  }

  #closeOverlay() {
    const overlayRef = this.#overlayRef();
    if (!isNumber(this.#closeTimeoutId) && overlayRef.hasAttached()) {
      this.#closeTimeoutId = setTimeout(() => {
        overlayRef.detach();
      }, this.shMarkdownTooltipCloseDelay());
    }
    if (isNumber(this.#showTimeoutId)) {
      clearTimeout(this.#showTimeoutId);
      this.#showTimeoutId = undefined;
    }
  }
  /** 进入时删除关闭操作 */
  #clearCloseDelay() {
    if (isNumber(this.#closeTimeoutId)) {
      clearTimeout(this.#closeTimeoutId);
      this.#closeTimeoutId = undefined;
    }
  }

  #overlay = inject(Overlay);
  #elRef = inject(ElementRef);

  #strategy = computed(() =>
    this.#overlay
      .position()
      .flexibleConnectedTo(this.#elRef)
      .withPositions(
        this.shMarkdownTooltipPosition()
          ? positionMap(this.shMarkdownTooltipPosition())
          : [
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
              {
                originX: 'end',
                originY: 'top',
                overlayX: 'start',
                overlayY: 'center',
              },
            ],
      ),
  );
  #overlayRef = computed(() =>
    this.#overlay.create(
      new OverlayConfig({
        positionStrategy: this.#strategy(),
      }),
    ),
  );
  #injector = inject(Injector);

  #portal = new ComponentPortal(MarkdownComponent, undefined, this.#injector);
  ngOnInit(): void {}
  ngOnDestroy(): void {
    this.#closeOverlay();
  }
}
