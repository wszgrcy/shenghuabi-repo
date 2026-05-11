import { getUniqueObjectKey } from '@share/util/uniq-object-key';
import { LRUCache } from 'lru-cache';
import { createInjector, inject, Injector } from 'static-injector';
import { TransformersReRankerService } from './transformers.ranker.service';
import { ReRanker_OPTIONS_TOKEN } from './type';
import * as v from 'valibot';
import { ReRanker } from '@global';
import { ExtensionConfig } from '../../config.service';
import { chunk } from 'lodash-es';
const ServiceObj = {
  transformers: TransformersReRankerService,
  //   openai: OpenAIEmbeddingService,
};
export class ReRankerService {
  #cache = new LRUCache<string, TransformersReRankerService, any>({
    max: 5,
    dispose: (value, key) => {
      return value.destroy();
    },
  });
  #injector = inject(Injector);
  get(options?: NonNullable<v.InferOutput<typeof ReRanker>>) {
    options = ExtensionConfig.reranker()!;
    const key = getUniqueObjectKey(options);
    //  || getUniqueObjectKey(options);
    if (this.#cache.has(key)) {
      return this.#cache.get(key)!;
    }
    const Service = (ServiceObj as any)[options.startupType!];

    const injector = createInjector({
      providers: [
        Service,
        { provide: ReRanker_OPTIONS_TOKEN, useValue: options },
      ],
      parent: this.#injector,
    });
    const instance = injector.get(Service);
    this.#cache.set(key, instance as any);
    return instance as TransformersReRankerService;
  }
  readonly step = 20;
  toKnowledge() {
    return {
      run: async (args: any) => {
        return Promise.all(
          chunk(args.docs, this.step).map(async (list, index) => {
            return (
              await this.get().run({
                value: args.value,
                docs: list,
              })
            ).map((item: any) => {
              return { ...item, index: item.index + index * this.step };
            });
          }),
        ).then((list) => {
          return list.flat().sort((a, b) => b.score - a.score);
        });
      },
      getQueryRatio: () => {
        return ExtensionConfig.reranker.ratio();
      },
    };
  }
}
