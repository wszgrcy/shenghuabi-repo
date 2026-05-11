import { ReactNode, useMemo, useRef, useState } from 'react';
import { usePrevious } from 'react-use';
import { differenceBy } from 'es-toolkit';
/**
 * 1. 传入pre hook
 * 2. component数据比较
 */
export interface DiffHandleProps<T> {
  list: T[];
}
export interface DiffHandleOptions<T> {
  creatChild: (list: T[], item: T, index: number) => ReactNode;
  diffCompareFn: (item: T) => any;
  diffWhen: (
    preValue: T[] | undefined,
    currentValue: T[],
    diffValue: T[],
  ) => Promise<any>;
  /** 创建后,未返回前执行,理论上最接近了 */
  afterBuild: () => void;
}

export function createDiffHandle<T>(options: DiffHandleOptions<T>) {
  return (props: DiffHandleProps<T>) => {
    const preValue = usePrevious<T[]>(props.list);
    const currentRef = useRef(props.list);
    /** diff后异步更新 */
    const [update2, setUpdate2] = useState(0);
    const update$ = useRef(0);
    /** 直接更新 */
    const update1 = useMemo(() => {
      if (!preValue) {
        return update$.current;
      }
      const diffResult = differenceBy(
        preValue,
        props.list,
        options.diffCompareFn,
      ) as T[];
      if (!diffResult.length) {
        if (preValue.length !== props.list.length) {
          currentRef.current = props.list;
          update$.current++;
        }
        return update$.current;
      }

      currentRef.current = props.list;
      options.diffWhen(preValue, props.list, diffResult).then(() => {
        setUpdate2((v) => v + 1);
      });

      return update$.current;
    }, [props.list, preValue]);
    const list = useMemo(() => {
      return currentRef.current.map((item, index) =>
        options.creatChild(currentRef.current, item, index),
      );
    }, [update1, update2]);
    useMemo(() => {
      options.afterBuild();
    }, [list]);
    return list;
  };
}
