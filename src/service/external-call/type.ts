export enum InstallStatus {
  unknown = 'unknown',
  installed = 'installed',
  uninstalled = 'uninstalled',
  failed = 'failed',
}
export enum RunningStatus {
  unknown = 'unknown',
  running = 'running',
  stopped = 'stopped',
  failed = 'failed',
  starting = 'starting',
}
export enum Message {
  installed = `已安装`,
  uninstalled = `未安装`,
  starting = '启动中',
  running = '运行中',
  failed = '运行失败',
}
export interface InstallMessage {
  value?: number;
  type?: string;
  message?: string;
}
export type InstallMessageCallback = (data: InstallMessage) => any;
