import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
} from '@angular/core';
import {
  fromEvent,
  map,
  pairwise,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

@Directive({
  selector: '[appResizable]',
  standalone: true,
})
export class ResizableDirective {
  @Input() direction!: string;
  @Output() resizeChagne = new EventEmitter<{ x: number; y: number }>();
  #elementRef = inject(ElementRef);
  #ngZone = inject(NgZone);
  #destroy$$ = new Subject();
  ngOnInit(): void {
    this.#ngZone.runOutsideAngular(() => {
      this.#listen();
    });
  }
  #listen() {
    const el = this.#elementRef.nativeElement;
    fromEvent<MouseEvent>(el, 'mousedown')
      .pipe(
        takeUntil(this.#destroy$$),
        switchMap((start) =>
          fromEvent<MouseEvent>(document, 'mousemove').pipe(
            takeUntil(fromEvent(document, 'mouseup')),
            startWith(start),
            tap((e) => {
              e.preventDefault();
            }),
            pairwise(),
            map(([pre, current]) => ({
              x: current.screenX - pre.screenX,
              y: current.screenY - pre.screenY,
            })),
          ),
        ),
      )
      .subscribe((e) => {
        this.resizeChagne.next(e);
      });
  }
  ngOnDestroy(): void {
    this.#destroy$$.next(undefined);
    this.#destroy$$.complete();
  }
}
