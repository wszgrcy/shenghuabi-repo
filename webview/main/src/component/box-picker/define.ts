export const DirectionList = [
  { label: '下侧方向', value: 'bottom' },
  { label: '上侧方向', value: 'top' },
  { label: '左侧方向', value: 'left' },
  { label: '右侧方向', value: 'right' },
  { label: '水平方向', value: 'x' },
  { label: '竖直方向', value: 'y' },
  { label: '所有方向', value: 'global' },
] as const;
export const DirectionMap = DirectionList.reduce(
  (obj, item) => {
    (obj as any)[item.value] = item.label;
    return obj;
  },
  {} as ValueToLabel<typeof DirectionList>,
);

type ValueToLabel<T extends readonly { label: string; value: string }[]> = {
  [K in T[number]['value']]: Extract<T[number], { value: K }>['label'];
};
