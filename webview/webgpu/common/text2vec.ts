import { env, pipeline } from '@huggingface/transformers';
import type { FeatureExtractionPipeline } from '@huggingface/transformers';

import { FileProxyCache } from './custom-cache';
type PipeLineOptions = Partial<NonNullable<Parameters<typeof pipeline>[2]>>;
export interface ExtractorOption {
  value: string | string[];
  shape?: number[];
}
export interface Text2VecOptions {
  cache: {
    match: (request: string) => Promise<ArrayBuffer | undefined>;
    put: (request: string, arraybuffer: ArrayBuffer) => Promise<void>;
  };
}
export interface InitOptions {
  dir: string;
  modelName: string;
  options: PipeLineOptions;
  wasmPaths: string;
  direct?: boolean;
  device: 'wasm'| 'webgpu';
}
export class Text2VecService {
  #pipeline: FeatureExtractionPipeline | undefined;
  constructor(private options: Text2VecOptions) {}

  async #runPipeLine(options: ExtractorOption): Promise<number[] | number[][]> {
    return this.#pipeline!(options.value, {
      pooling: 'mean',
      normalize: true,
    }).then((result) => {
      let list = result.tolist();
      return typeof options.value === 'string' ? list[0] : list;
    });
  }

  init = async (options: InitOptions) => {
    this.#pipeline = await this.#downloadOnly(
      options.dir,
      options.modelName,
      options.options,
      options.wasmPaths,
      options.direct,
    );
    return !!this.#pipeline;
  };
  extractor = (value: any) => {
    return this.#runPipeLine(value);
  };

  async #downloadOnly(
    dir: string,
    modelName: string,
    options: PipeLineOptions,
    wasmPaths: string,
    direct?: boolean,
  ) {
    env.useFS = false;
    env.localModelPath = dir;
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.cacheDir = dir;
    env.customCache = new FileProxyCache(dir, modelName, this.options.cache);
    env.useBrowserCache = false;
    env.useFSCache = false;
    env.useCustomCache = true;
    env.backends.onnx.webgpu!.powerPreference = 'high-performance';
    if (options.device === 'wasm') {
      env.backends.onnx.wasm!.numThreads = navigator.hardwareConcurrency / 2;
    }
    env.backends.onnx.wasm!.wasmPaths = wasmPaths;
    const list = [undefined];
    if (direct) {
      list.reverse();
    }
    let result;
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const oldUrl = env.remoteHost;
      if (typeof item === 'string') {
        env.remoteHost = item;
      }
      try {
        result = await pipeline('feature-extraction', modelName, {
          device: 'webgpu',
          ...options,
        });
        break;
      } catch (error) {}
      env.remoteHost = oldUrl;
    }
    return result;
  }
  async getSize() {
    return (this.#pipeline!.model.config as any).hidden_size;
  }
}
