import { Component, inject, signal } from '@angular/core';
import { DocumentEvent } from '@bridge/share';
import { TrpcService } from '@fe/trpc';

import { PiyingView } from '@piying/view-angular';
import { FieldGlobalConfig } from '@fe/form/default-type-config';
import { TTSFileConfigDefine } from '@shenghuabi/python-addon/define';
import { BehaviorSubject, map, Observable, of, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [PiyingView],
  providers: [],
})
export default class TTSEditor {
  #client = inject(TrpcService).client;
  #trpc = inject(TrpcService);
  readonly Define = TTSFileConfigDefine;
  options = {
    context: this,
    fieldGlobalConfig: FieldGlobalConfig,
  };
  model = signal({});
  #model$$ = toObservable(this.model);
  #inited$ = signal(false);
  #gLoading$ = new BehaviorSubject(false);
  ngOnInit(): void {
    // 这里的数据变更比如说撤销什么的?但是我觉得好像不需要,一次性一个就行
    this.#client.tts.dataChange.subscribe(undefined, {
      onData: (value) => {
        this.model.set(value);
        this.#inited$.set(true);
      },
    });
    this.#client.tts.inited.query(undefined);

    // 保存就行
    this.#trpc.client.mind.listenEvent.subscribe(undefined, {
      onData: async (request) => {
        const response = { id: request.id, data: undefined as any };
        switch (request.method) {
          case DocumentEvent.getContent: {
            response.data = this.model();
            break;
          }
          default:
            break;
        }
        if (!response.data) {
          return;
        }
        this.#trpc.client.tts.sendEvent.query(response, {
          context: { compress: true },
        });
      },
    });
  }
  valueChange(value: any) {
    if (!this.#inited$()) {
      return;
    }
    this.#trpc.client.tts.sendEvent.query(
      {
        id: 0,
        method: 'update',
        data: value,
      },
      { context: { compress: true } },
    );
  }
  getAudioReferenceList() {
    return this.#client.environment.pythonAddon.getPlayerIdList.query(
      undefined,
    );
  }
  getIndexTTSEmoReferenceList() {
    return this.#client.environment.pythonAddon.getEmoPlayerIdList.query(
      undefined,
    );
  }
  showIndexTTSEmo() {
    return this.#client.environment.pythonAddon.getTTSBackend
      .query(undefined)
      .then((item) => item === 'IndexTTS-2');
  }
  /** 音频url */
  #dataMap = new BehaviorSubject<Observable<any>[]>([]);
  /** 加载用的 */
  #loadingMap = new BehaviorSubject<any[]>([]);
  /** 获得音频url */
  getAudioItemOutputFile(index: number) {
    if (!this.#dataMap.value[index]) {
      const item = this.#gLoading$.pipe(
        switchMap((item) => {
          if (item) {
            return this.#loadingMap.pipe(
              map((loadingList) => {
                return loadingList[index];
              }),
            );
          }
          return this.#model$$.pipe(
            map((model: any) => model.output?.list?.[index]),
          );
        }),
        switchMap((url) => {
          return url
            ? this.#client.tts.getAudioAssetPath.query(url)
            : of(undefined);
        }),
      );
      this.#dataMap.value[index] = item;
      this.#dataMap.next([...this.#dataMap.value]);
      return item;
    }
    return this.#dataMap.value[index];
  }
  apply() {
    this.#gLoading$.next(true);
    this.#loadingMap.next([]);
    return new Promise<void>((resolve, reject) => {
      this.#client.tts.textToAuduio.subscribe(this.model(), {
        onData: (value) => {
          const data = value.data;
          if (value.type === 0) {
            const list = [...this.#loadingMap.value];
            list.push(data.chunkPath);
            this.#loadingMap.next(list);
          } else if (value.type === 1) {
            const output = data.output;
            this.model.update((oldData) => {
              return {
                ...oldData,
                output,
              };
            });
            this.valueChange(this.model());
          }
        },
        onComplete: () => {
          this.#gLoading$.next(false);
          resolve();
        },
        onError: reject,
      });
    });
  }
  openLog() {
    this.#client.environment.showChannel.query('TTS');
  }
  changeAudioItem(value: any, pluginName: string) {
    return this.#client.tts.changeAudioItem.query([value, pluginName]);
  }
  resetAudioItem(value: any) {
    return this.#client.tts.resetAudioItem.query(value);
  }
  changeAudioList(value: any) {
    return this.#client.tts.changeAudioList.query(value);
  }
  resetAudioList(value: any) {
    return this.#client.tts.resetAudioList.query(value);
  }

  getAudioPluginList() {
    return this.#client.tts.getAudioPluginList.query(undefined);
  }
}
