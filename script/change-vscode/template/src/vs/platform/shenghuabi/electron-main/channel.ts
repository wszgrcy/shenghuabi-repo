import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
  session,
  shell,
} from 'electron';
import path, { dirname } from 'path';
import fs from 'fs';
import { Emitter, Event } from '../../../base/common/event.js';
import { URI } from '../../../base/common/uri.js';
import { VSBuffer } from '../../../base/common/buffer.js';
import querystring from 'node:querystring';

function changeHeader(
  originHeaders: Record<string, any> | undefined,
  changedHeaders: Record<string, any>,
) {
  if (!originHeaders) {
    originHeaders = {};
  }
  const headerMap = Object.keys(originHeaders).reduce(
    (obj, item) => {
      obj[item.toLowerCase()] = item;
      return obj;
    },
    {} as Record<string, any>,
  );
  for (const key in changedHeaders) {
    const value = changedHeaders[key];
    originHeaders[headerMap[key.toLowerCase()] || key] = value;
  }
  return originHeaders;
}
// 目前是只提供webgpu,以后再改
export class ShbChannel<TContext> {
  static channelType = 'ShengHuabi' as const;
  #mainWindow?: BrowserWindow;
  #listenMap = new Map<number, (data: any) => any>();
  #idIndex = 0;
  #dispose?: () => Promise<any>;
  #fileIndex = 0;
  #readFileEmitter = new Emitter<{ index: number; data: any }>();
  fileMap = new Map<
    number,
    { resolve: (a: any) => void; reject: (a: any) => void }
  >();
  constructor() {
    this.protocolChange();
  }
  async call(
    ctx: TContext,
    command: string,
    arg?: { method: string; parameters: any[]; result: any },
  ): Promise<any> {
    switch (command) {
      case 'electron':
        return (this.electron as any)[arg!.method](...arg!.parameters);
      case 'readFile': {
        const [index, result, data] = arg as any as any[];
        if (result) {
          this.fileMap.get(index)!.resolve(data);
        } else {
          this.fileMap.get(index)!.reject(data);
        }
        this.fileMap.delete(index);
        return;
      }
    }
    throw new Error('Method not implemented.');
  }
  // 貌似不能反向监听,因为Event透传问题?未详细测试,可能每一层都需要手动转换实现
  listen(ctx: TContext, event: string, arg?: any): Event<any> {
    switch (event) {
      case 'readFile':
        return this.#readFileEmitter.event;
    }
    throw new Error(`[${event}]方法没有实现`);
  }
  async #electronSend(channel: string, arg?: any) {
    const index = this.#idIndex++;
    let resolve: (a: any) => void;
    // let reject: (a: any) => void
    const p = new Promise((res, rej) => {
      resolve = res;
      // reject = rej
    });
    this.#listenMap.set(index, (data) => {
      resolve(data);
    });
    this.#mainWindow!.webContents.send(channel, { id: index, data: arg });
    return p;
  }
  electron = {
    openPath: async (filePath: string) => {
      try {
        let stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) {
          shell.openPath(filePath);
        } else {
          shell.showItemInFolder(filePath);
        }
      } catch (error) {}
    },
    createBrowserWindow: async (
      options: BrowserWindowConstructorOptions,
      file: any,
    ) => {
      await this.#dispose?.();
      const list = BrowserWindow.getAllWindows();
      const maybeParent = list[0];
      ipcMain.on(
        'shb:response',
        (_event, data: { data: any; id: number; channel: string }) => {
          const result = this.#listenMap.get(data.id);
          if (!result) {
            throw new Error(`loss request ${data.channel}:${data.id}`);
          } else {
            result(data.data);
          }
        },
      );
      ipcMain.handle('shb:cache:match', async (_event, request: string) => {
        const filePath = path.normalize(request);
        try {
          const result = await fs.promises.stat(filePath);
          if (result.isFile()) {
            return fs.promises
              .readFile(filePath)
              .then((result) => result.buffer);
          }
        } catch (error) {}
        return undefined;
      });
      ipcMain.handle(
        'shb:cache:put',
        async (_event, request: string, arrayBuffer: ArrayBuffer) => {
          const filePath = path.normalize(request);
          const dirPath = dirname(filePath);
          await fs.promises.mkdir(dirPath, { recursive: true });
          await fs.promises.writeFile(filePath, new Uint8Array(arrayBuffer));
        },
      );

      const win = new BrowserWindow({ ...options, parent: maybeParent });
      const types = ['xhr', 'script', 'mainFrame'];
      win.webContents.session.webRequest.onHeadersReceived(
        (details, callback) => {
          if (
            details.url.startsWith('https://marketplace.visualstudio.com') ||
            details.url.includes('vsassets.io') ||
            details.url.startsWith(
              'https://vscode.download.prss.microsoft.com/',
            )
          ) {
            return callback({});
          }
          if (
            types.includes(details.resourceType) &&
            (details.url.startsWith(`vscode-file://`) ||
              details.url.startsWith(`https://`))
          ) {
            return callback({
              responseHeaders: changeHeader(details.responseHeaders, {
                ['Access-Control-Allow-Origin']: '*',
                ['Access-Control-Allow-Headers']: '*',
                ['Cross-Origin-Embedder-Policy']: 'require-corp',
                ['Cross-Origin-Opener-Policy']: 'same-origin',
              }),
            });
          }
          return callback({});
        },
      );
      if (options.webPreferences!.devTools) {
        win.webContents.openDevTools();
      }
      await win.loadURL(file);
      this.#mainWindow = win;
      this.#dispose = async () => {
        ipcMain.removeAllListeners('shb:response');
        ipcMain.removeHandler('shb:cache:match');
        ipcMain.removeHandler('shb:cache:put');
        win.destroy();
        this.#dispose = undefined;
      };
    },
    sendToMain: async (channel: string, data: any) => {
      return this.#electronSend(channel, data);
    },
    destroy: () => {
      return this.#dispose?.();
    },
  };
  protocolChange() {
    session.defaultSession.protocol.handle('shb', async (request) => {
      const uri = URI.parse(request.url);
      const index = this.#fileIndex++;
      let resolve: (a: any) => void;
      let reject: (a: any) => void;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      this.fileMap.set(index, { resolve: resolve!, reject: reject! });
      this.#readFileEmitter.fire({
        index,
        data: uri
          .with({
            scheme: uri.authority,
            authority: null,
          })
          .toJSON(),
      });
      let qs = querystring.decode(uri.query);
      const result: any = (await promise) as any;
      if (qs['content-type'] as any) {
        return new Response(result.buffer, {
          headers: { 'content-type': qs['content-type'] as any },
        });
      }
      return new Response(result.buffer);
    });
  }
}
