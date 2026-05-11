import { useEffect, useRef, useState } from 'react';

export function useLastState<T>(initValue: T) {
  const [current, setCurrent] = useState(initValue);
  const ref = useRef<T>();
  const preValue = ref.current;
  useEffect(() => {
    ref.current = current;
  }, [current]);

  return [preValue, current, setCurrent] as const;
}
