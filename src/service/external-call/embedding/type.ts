import { InjectionToken } from 'static-injector';
import { ExtensionConfigType } from '../../config.service';

export type ExtractorFn = <T extends string | string[]>(
  value: T,
) => Promise<T extends string ? number[] : number[][]>;

export interface EmbeddingModelOptions {
  model: string;
  size: number;
  type: NonNullable<ExtensionConfigType['text2vec']>['startupType'];
  baseURL?: string;
  dtype?: string;
  device?: string;
}

export const EMBEDDING_OPTIONS_TOKEN =
  new InjectionToken<EmbeddingModelOptions>('EMBEDDING_OPTIONSN');
