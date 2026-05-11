import { Signal } from 'static-injector';
import { InstallStatus, RunningStatus } from '../type';
import { EmbeddingModelOptions } from './type';
export interface EmbeddingStatus {
  installStatus$: Signal<InstallStatus>;
  runningStatus$: Signal<RunningStatus>;
}
export interface EmbeddingBase {
  init(): any;
  destroy(): Promise<any>;
  getSize(): Promise<number>;
  extractor<T extends string | string[]>(
    value: T,
  ): Promise<T extends string ? number[] : number[][]>;
  getOptions(): Promise<EmbeddingModelOptions>;
  clean?: () => void;
}
