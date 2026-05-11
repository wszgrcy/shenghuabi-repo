export const githubUrlDownload =
  (prefix: string, fileName: string, version: string) =>
  (url = 'github.com') =>
    `https://${url}/${prefix}/releases/download/${version}/${fileName}`;
