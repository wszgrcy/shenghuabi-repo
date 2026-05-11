const textType = 'text/plain';
const customType = 'web application/x-shb-editor';
export type ClipboardKind = 'mind-node' | 'workflow-node';
function createBlob(data: Record<string, any>, type: string) {
  return new Blob([JSON.stringify(data)], { type });
}
export function setCopy(kind: ClipboardKind, data: Record<string, any>) {
  const board = navigator.clipboard;

  return board.write([
    new ClipboardItem({
      [textType]: createBlob({ mimeType: customType, kind, data }, textType),
      [customType]: createBlob({ kind, data }, customType),
    }),
  ]);
}

export function getCopy<T = any>(kind: ClipboardKind): Promise<T | undefined> {
  const board = navigator.clipboard;
  return board.read().then(async (list) => {
    const item = list[0];
    if (item.types.includes(customType)) {
      const result = JSON.parse(await (await item.getType(customType)).text());
      return result.kind === kind ? result.data : undefined;
    } else if (item.types.includes(textType)) {
      try {
        const result = JSON.parse(await (await item.getType(textType)).text());
        if ('mimeType' in result && result.mimeType === customType) {
          return result.kind === kind ? result.data : undefined;
        }
      } catch (error) {}
    }
    return undefined;
  });
}

export function isCopyData(
  kind: ClipboardKind,
  dataTransfer: DataTransfer | null,
) {
  if (!dataTransfer) {
    return false;
  }

  const data = dataTransfer.getData(textType);
  try {
    const result = JSON.parse(data);
    if (
      result &&
      typeof result === 'object' &&
      result.mimeType === customType &&
      result.kind === kind
    ) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
