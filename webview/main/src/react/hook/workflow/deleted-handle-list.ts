import { HandleNode } from '@bridge/share';
import { useLastState } from '../last-state';
import { differenceBy } from 'lodash-es';
import { useMemo } from 'react';
const EMPTY: any[] = [];
export function useDeletedHandleList(list: HandleNode[]): HandleNode[] {
  const [preValue, curValue, setCurrent] = useLastState(list);
  const diffList = useMemo(() => {
    const result = differenceBy(preValue, curValue, (item) => item.id);
    return result.length ? result : EMPTY;
  }, [preValue, curValue]);
  useMemo(() => {
    setCurrent(list);
  }, [list]);
  return diffList;
}
