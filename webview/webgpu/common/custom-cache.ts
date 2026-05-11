import { env } from '@huggingface/transformers';
export interface NodeProxy {
  match: (request: string) => Promise<ArrayBuffer | undefined>;
  put: (request: string, arraybuffer: ArrayBuffer) => Promise<void>;
}
export class FileProxyCache {
  path;
  nodeProxy;
  constructor(
    path: string,
    private modelName: string,
    nodeProxy: {
      match: (request: string) => Promise<ArrayBuffer | undefined>;
      put: (request: string, arraybuffer: ArrayBuffer) => Promise<void>;
    },
  ) {
    this.path = path;
    this.nodeProxy = nodeProxy;
  }

  async match(request: string): Promise<FileResponse | undefined> {
    let result = await this.nodeProxy.match(request);
    if (result) {
      return new FileResponse(request, result);
    }
    return undefined;
  }

  async put(request: string, response: Response | FileResponse): Promise<void> {
    let data = new URL(request);
    // todo 默认是main,以后再说
    await this.nodeProxy.put(
      this.path +
        data.pathname.replace(
          '/' +
            env.remotePathTemplate
              .replaceAll('{model}', this.modelName)
              .replaceAll('{revision}', encodeURIComponent('main')),
          `/${this.modelName}/`,
        ),
      await response.arrayBuffer(),
    );
  }
}
let decoder = new TextDecoder('utf-8');
const CONTENT_TYPE_MAP = {
  txt: 'text/plain',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
};
class FileResponse {
  filePath;
  headers;
  exists = true;
  status = 200;
  statusText = 'OK';
  body;
  #arraybuffer;
  constructor(filePath: string, arraybuffer: ArrayBuffer) {
    this.#arraybuffer = arraybuffer;
    this.filePath = filePath;
    this.headers = new Headers();

    this.headers.set('content-length', arraybuffer.byteLength.toString());

    this.updateContentType();

    let self = this;
    this.body = new ReadableStream({
      start(controller) {
        self.arrayBuffer().then((buffer) => {
          controller.enqueue(new Uint8Array(buffer));
          controller.close();
        });
      },
    });
  }

  updateContentType() {
    const extension = this.filePath.toString().split('.').pop()!.toLowerCase();
    this.headers.set(
      'content-type',
      (CONTENT_TYPE_MAP as any)[extension] ?? 'application/octet-stream',
    );
  }

  clone(): FileResponse {
    let response = new FileResponse(this.filePath, this.#arraybuffer);
    response.exists = this.exists;
    response.status = this.status;
    response.statusText = this.statusText;
    response.headers = new Headers(this.headers);
    return response;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return this.#arraybuffer;
  }

  async blob(): Promise<Blob> {
    return new Blob([this.#arraybuffer], {
      type: this.headers.get('content-type')!,
    });
  }

  async text(): Promise<string> {
    return decoder.decode(this.#arraybuffer);
  }

  async json(): Promise<object> {
    return JSON.parse(await this.text());
  }
}
