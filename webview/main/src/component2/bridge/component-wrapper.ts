import {
  createComponent,
  ComponentRef,
  ApplicationRef,
  reflectComponentType,
  effect,
  Signal,
  Type,
  NgZone,
  WritableSignal,
  ElementRef,
} from '@angular/core';
import {
  ENVIRONMENT_INJECTOR_CONTEXT,
  INJECTOR_CONTEXT,
} from '@cyia/ngx-bridge/react-outlet';
import {
  ReactPortal,
  createElement,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
export interface ReactComponentWrapper {
  /** input() / @Input() */
  props?: Record<string, any>;
  /** 当Angular组件被作为React组件调用时,且组件内部有react-outlet时使用 */
  children?: Signal<(() => React.ReactPortal)[]>;
  /** 由外部定义 */
  output?: WritableSignal<Record<string, any> | undefined>;
}
/**
 * 可以在 component中 使用static runInReact 定义上下文,也可以直接传入
 * 被调用组件内的一级outlet的root需要为false(因为作为react函数组件/元素被调用)
 */

export function wrapperToReact(
  /** ng组件 */
  component: Type<any>,
  options?: Partial<Parameters<typeof createComponent>[1]>,
  reactOptions?: {
    forwardRef: boolean;
  },
) {
  /** ng componentRef signal */

  const def = reflectComponentType(component)!;
  const fn = (
    props: { inputs: Record<string, any>; className?: string },
    inputRef?: any,
  ) => {
    const [children, setChildren] = useState<ReactPortal[]>([]);
    const className = props.className;
    const elRef = useRef<HTMLDivElement>(undefined as any);
    const environmentInjector =
      options?.environmentInjector || useContext(ENVIRONMENT_INJECTOR_CONTEXT)!;
    const elementInjector =
      options?.elementInjector || useContext(INJECTOR_CONTEXT);
    const appRef = environmentInjector.get(ApplicationRef);
    const zone = environmentInjector.get(NgZone);
    const componentRefV = useRef<
      ComponentRef<ReactComponentWrapper> | undefined
    >(undefined);
    const [inited, setInited] = useState(false);
    useEffect(() => {
      const componentRef = zone.run(() => {
        const componentRef = createComponent<ReactComponentWrapper>(component, {
          hostElement: elRef.current,
          ...options,
          environmentInjector,
          elementInjector,
        });
        return componentRef;
      });
      const instance = componentRef.instance;

      // 更新内部react-outlet
      if (instance.children) {
        effect(
          () => {
            const children = instance.children!().map((item) => item());
            setChildren(children);
          },
          { injector: componentRef.injector },
        );
      }
      componentRefV.current = componentRef;
      return () => {
        componentRef.destroy();
      };
    }, []);
    // 更新属性
    useEffect(() => {
      if (!componentRefV.current) {
        return;
      }
      const instance = componentRefV.current.instance;
      if (!inited) {
        appRef.attachView(componentRefV.current.hostView);
        setInited(true);
      }
      if (!instance.props) {
        return;
      }
      zone.run(() => {
        for (const key in props.inputs) {
          const value = props.inputs[key];
          componentRefV.current!.setInput(key, value);
        }
      });
    }, [componentRefV, props.inputs]);
    useEffect(() => {
      if (!componentRefV.current || !inited || typeof className !== 'string') {
        return;
      }
      const elementRef =
        componentRefV.current.injector.get<ElementRef<HTMLElement>>(ElementRef);
      elementRef.nativeElement.className = className;
    }, [componentRefV, className, inited]);

    return createElement(def.selector, { ref: elRef }, ...children);
  };
  const fnComponent = reactOptions?.forwardRef ? forwardRef(fn) : fn;
  return fnComponent;
}
export function NgOutletReact(props: {
  component: Type<any>;
  options?: Partial<Parameters<typeof createComponent>[1]>;
  props?: any;
  className?: string;
  otherInputs?: Record<string, any>;
}) {
  const el = useMemo(
    () =>
      wrapperToReact(props.component, props.options, {
        forwardRef: !!props.props?.ref,
      }),
    [],
  );

  return createElement(el, {
    inputs: {
      props: props.props,
      ...props.otherInputs,
    },
    className: props.className,
  });
}
export const AngularOutletReact = NgOutletReact;
