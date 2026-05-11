export function webviewAssetPath(str: string) {
  return process.platform === 'win32' ? `/${str}` : str;
}
