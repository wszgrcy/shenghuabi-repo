import { InjectionToken } from 'static-injector';
import * as v from 'valibot';
import { ReRanker } from '@global';
export type ReRankerModelOptions = NonNullable<v.InferOutput<typeof ReRanker>>;

export const ReRanker_OPTIONS_TOKEN = new InjectionToken<ReRankerModelOptions>(
  'EMBEDDING_OPTIONSN',
);
