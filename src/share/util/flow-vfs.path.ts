export function getImgSrcFactory(filePath: string) {
  return (imgName: string) => {
    return new URL(
      `shb://flow-vfs/${imgName}?${new URLSearchParams([
        ['type', 'image'],
        ['filePath', filePath],
      ])}`,
    ).toString();
  };
}
