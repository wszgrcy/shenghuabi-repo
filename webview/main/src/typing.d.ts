declare function acquireVsCodeApi(): any;
interface Vscode {
  getState(): any;
  setState(arg: any): any;
  postMessage(arg: any): any;
}
declare const vscode: Vscode;
interface Window {
  EXCALIDRAW_ASSET_PATH: string;
  vscode: Vscode;
  __pageConfig: {
    /** 用于路由导航 */
    page: string;
    data: {
      filePath?: string;
      // fragment?: string;
      id?: string;
      /** 目前在脑图中提供 */
      // relPath?: string;
      graphName?: string;
    };
  };
}
declare const ngDevMode: boolean;
declare const ENV: string;

interface FontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}
