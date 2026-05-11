import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
  ViewChild,
} from '@angular/core';
import { ClipboardKind } from '@fe/util/clipboard';
import { FlowBseService } from './flow-base.service';
import {
  debounceTime,
  filter,
  fromEvent,
  map,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { ErrorBoundary } from 'react-error-boundary';
import { createElement } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { toObservable } from '@angular/core/rxjs-interop';
import { errorFormat } from '@share/util/error-format';
import { TrpcService } from '@fe/trpc';

@Directive()
export class FlowBaseDirective {
  @ViewChild('contextMenu', {
    read: ElementRef,
  })
  contextMenu!: ElementRef<HTMLElement>;
  reactflowElement = viewChild.required<
    ElementRef<HTMLElement>,
    ElementRef<HTMLElement>
  >('flowwrapper', {
    read: ElementRef<HTMLElement>,
  });
  #service = inject(FlowBseService);
  #trpc = inject(TrpcService);
  #client = this.#trpc.client;
  readonly nodeClipBoardKind!: ClipboardKind;
  #destroyRef = inject(DestroyRef);
  protected error$ = signal<Error | undefined>(undefined);
  protected readonly ReactFlowProvider = (props: any) => {
    return createElement(
      ErrorBoundary,
      {
        fallbackRender: (props) => {
          this.error$.set(props.error);
          return createElement('div');
        },
      },
      createElement(ReactFlowProvider, props.props, props.children),
    );
  };
  protected injector = inject(Injector);
  protected requestData = new Subject<any>();
  protected async resolvedData(
    instance: NonNullable<ReturnType<FlowBseService<any>['instance']>>,
    data: any,
  ) {
    throw '';
  }
  protected listenUpdate(): Subscription {
    throw '';
  }
  constructor() {
    window.addEventListener('contextmenu', (e) => e.preventDefault(), {
      capture: true,
    });
    let timeoutId: any;
    let ref: Subscription | undefined;
    this.requestData
      .pipe(
        switchMap((data) => {
          return toObservable(this.#service.instance, {
            injector: this.injector,
          }).pipe(
            filter(Boolean),
            take(1),
            map((instance) => {
              return [instance, data] as const;
            }),
          );
        }),
        tap(() => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
          }
          if (ref) {
            ref.unsubscribe();
            ref = undefined;
          }
        }),
      )
      .subscribe(([instance, data]) => {
        try {
          this.resolvedData(instance, data);
        } catch (error) {
          this.#client.common.error.query(errorFormat(error));
        }
        timeoutId = setTimeout(() => {
          ref = this.listenUpdate();
        }, 1000);
      });
  }
  ngOnInit(): void {
    this.#service.setClipboard(this.nodeClipBoardKind, this.#destroyRef);
    fromEvent<MouseEvent>(this.reactflowElement().nativeElement, 'mousemove')
      .pipe(debounceTime(50))
      .subscribe((e) => {
        this.#service.movedPosition$.set({ x: e.clientX, y: e.clientY });
      });
  }

  protected contextChange(
    event: React.MouseEvent,
    type: 'node' | 'pane' | 'selection',
  ) {
    event.preventDefault();

    const rect = (
      this.reactflowElement().nativeElement as HTMLElement
    ).getBoundingClientRect();

    this.#service.contextmenuType.set(type);
    this.contextMenu.nativeElement.style.top =
      event.nativeEvent.clientY - rect.y + 'px';
    this.contextMenu.nativeElement.style.left =
      event.nativeEvent.clientX - rect.x + 'px';

    this.#service.contextMenuPoint.set({
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    });
    this.contextMenu.nativeElement.click();
  }
}
