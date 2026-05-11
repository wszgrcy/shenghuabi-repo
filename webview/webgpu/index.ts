import type { queueAsPromised } from 'fastq';
import { promise as fastq } from 'fastq';
import type { InitOptions, ExtractorOption } from './common/text2vec';
type CallBack = (input: any) => any;
let client = (window as any).shenghuabi as {
  hello: () => {};
  onPing: (callback: CallBack) => {};
  onExtractor: (callback: CallBack) => {};
  onInit: (callback: CallBack) => {};
  onSize: (callback: CallBack) => {};
  cache: {
    match: (request: string) => Promise<ArrayBuffer | undefined>;
    put: (request: string, arraybuffer: ArrayBuffer) => Promise<void>;
  };
};

class WorkWrapper {
  #instance = new Worker('./worker.mjs', { type: 'module' });
  #index = 0;
  #responseMap = new Map<number, (arg: any) => void>();
  constructor() {
    this.#instance.addEventListener('message', (ev) => {
      let { id, response, value, method, parameters } = ev.data;
      if (response) {
        this.#responseMap.get(id)!(value);
      } else {
        this.listener(id, method, parameters);
      }
    });
  }
  call(method: string, parameters: any[]) {
    let id = this.#index++;
    let { promise, resolve } = Promise.withResolvers<any>();
    this.#responseMap.set(id, resolve);
    this.#instance.postMessage({ method, parameters, id });
    return promise;
  }
  async listener(id: number, method: string, parameters: any[]) {
    let result;
    switch (method) {
      case 'cache:match':
        result = client.cache.match(parameters[0]);
        break;
      case 'cache:put':
        result = client.cache.put(parameters[0], parameters[1]);
        break;
      default:
        break;
    }
    this.#instance.postMessage({ id, value: await result, response: true });
  }
}
class Text2VecManager {
  #queue!: queueAsPromised<ExtractorOption, any>;

  #initOptions!: InitOptions;
  #idle = {
    wasm: true,
    webgpu: true,
  };
  #workerObj!: Record<string, WorkWrapper>;
  #inited = false;
  #extractor = async (options: ExtractorOption) => {
    if (!this.#inited) {
      return [];
    }
    const item = this.#initOptions!.device;
    let idle = this.#idle[item];
    if (idle) {
      this.#idle[item] = false;
      let worker =
        this.#workerObj[item] ??
        (await this.#initWorker(item, this.#initOptions)).instance;
      return worker.call('extractor', [options]).then((result) => {
        this.#idle[item] = true;
        return result;
      });
    }
  };
  async init(options: InitOptions) {
    this.#workerObj = {};
    this.#initOptions = options;
    this.#queue = fastq(this.#extractor, options.device.length);
    let firstDevice = options.device[0];
    let result = await this.#initWorker(firstDevice, options);
    this.#workerObj[firstDevice] = result.instance;
    return (this.#inited = result.result);
  }
  async #initWorker(device: string, options: InitOptions) {
    let instance = new WorkWrapper();
    await instance.call('create', []);
    let result = await instance.call('init', [
      {
        ...options,
        options: { ...options.options, device: device },
      },
    ]);
    return { instance, result };
  }
  extractor(value: string) {
    return this.#queue.push({ value: value });
  }
  getSize() {
    return this.#workerObj[this.#initOptions.device].call('getSize', []);
  }
}
let instance = new Text2VecManager();
client.onInit((data) => instance.init(data));
client.onExtractor((data) => instance.extractor(data));
client.onSize(() => instance.getSize());
client.onPing(() => 'pong');
