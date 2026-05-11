import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PI_VIEW_FIELD_TOKEN } from '@piying/view-angular';
import { deepEqual } from 'fast-equals';

const getParentWindow = (node?: HTMLDivElement | null): Window => {
  return (node && node.ownerDocument.defaultView) || self;
};

@Component({
  selector: 'offset-picker',
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class OffsetPickerNFCC {
  svgRef = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  #svg = computed(() => this.svgRef().nativeElement);
  offsetPosition$ = signal({ x: 50, y: 50 }, { equal: deepEqual });
  #elementRef = inject(ElementRef);
  #dragging = signal(false);
  #maxValue = 20;
  field = inject(PI_VIEW_FIELD_TOKEN);
  field2$$ = computed(() => {
    return this.field().get(['@offset'])!;
  });
  constructor() {
    effect(() => {
      const value = this.field2$$().form.control!.value;
      if (!value) {
        return;
      }
      this.offsetPosition$.set({
        x: (50 / this.#maxValue) * (value.offset.x ?? 0) + 50,
        y: (50 / this.#maxValue) * (value.offset.y ?? 0) + 50,
      });
    });
    const window = getParentWindow(this.#elementRef.nativeElement);
    fromEvent<MouseEvent>(window, 'mousemove')
      .pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (!this.#dragging()) {
          return;
        }
        this.#updatePos(e);
      });
    fromEvent(window, 'mouseup')
      .pipe(takeUntilDestroyed())
      .subscribe((e) => this.#dragging.set(false));
  }

  mousedownChange(e: MouseEvent) {
    this.#dragging.set(true);
    this.#updatePos(e);
  }
  #updatePos(e: MouseEvent) {
    const point = this.#svg().createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const t = point.matrixTransform(this.#svg().getScreenCTM()!.inverse());
    t.x = Math.min(Math.max(0, t.x), 100);
    t.y = Math.min(Math.max(0, t.y), 100);
    this.offsetPosition$.set(t);
    const offset = {
      x: Math.trunc(((t.x - 50) * (this.#maxValue / 50) * 100) / 100),
      y: Math.trunc(((t.y - 50) * (this.#maxValue / 50) * 100) / 100),
    };
    this.field2$$().form.control?.updateValue({ offset });
  }
}
