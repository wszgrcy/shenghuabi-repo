import { inject, RootStaticInjectOptions } from 'static-injector';

import { ExtensionConfig } from '../../config.service';
import {
  EMBEDDING_OPTIONS_TOKEN,
  EmbeddingModelOptions,
  ExtractorFn,
} from './type';
import { EmbeddingBase } from './embedding.service';
import { wrapperToArray } from '../../../util';
import { OpenAI } from 'openai';
export class OpenAIEmbeddingService
  extends RootStaticInjectOptions
  implements EmbeddingBase
{
  #fn$ = Promise.withResolvers<ExtractorFn>();
  #options = inject(EMBEDDING_OPTIONS_TOKEN);

  extractor<T extends string | string[]>(value: T) {
    return this.#fn$.promise.then((fn) => fn(value));
  }
  init() {
    const instance = new OpenAI({
      apiKey: ExtensionConfig.text2vec.apiKey() || ' ',
      baseURL: this.#options.baseURL,
    });
    this.#fn$.resolve((value) =>
      instance.embeddings
        .create({ input: wrapperToArray(value), model: this.#options.model })
        .then(
          ({ data }) =>
            (Array.isArray(value)
              ? data.map((item) => item.embedding)
              : data[0].embedding) as any,
        ),
    );
  }
  async getSize() {
    return this.#options.size;
  }
  async destroy() {}
  async getOptions(): Promise<EmbeddingModelOptions> {
    return {
      ...this.#options,
      size: await this.getSize(),
    };
  }
}
