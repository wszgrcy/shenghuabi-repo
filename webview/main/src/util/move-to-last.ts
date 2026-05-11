export function moveToLast<T extends { id: string }>(node: T, list: T[]) {
  const index = list.findIndex((item) => item.id === node.id);
  if (index !== list.length - 1) {
    list.splice(index, 1);
    list.push(node);
  }
  return list;
}
