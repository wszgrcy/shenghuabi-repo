import {
  Component,
  inject,
  Injector,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  NFCSchema,
  setComponent,
  asVirtualGroup,
  actions,
} from '@piying/view-angular-core';
import { DefaultFormTypes, Wrappers } from '@fe/form/default-type-config';
import { TrpcService } from '@fe/trpc';
import { asRow, selectOptions } from '@share/valibot';
import * as v from 'valibot';
import { ProgressComponent, ProgressInfo } from '../../progress/component';
import { asColumn } from '@cyia/component/valibot-util';
import { PiyingView } from '@piying/view-angular';
import {
  createProgress,
  EndDownloadMessage,
  ErrorDownloadMessage,
  FileLineDefine,
  StartDownloadMessage,
} from '../../const';
import { safeDefine } from '@fe/piying/define';
const FieldGlobalConfig = {
  types: {
    ...DefaultFormTypes,
    progress: {
      type: ProgressComponent,
    },
  },
  wrappers: {
    ...Wrappers,
  },
};
const Status = {
  running: {
    label: '运行中',
    color: 'primary',
    icon: {
      fontIcon: 'done',
    },
  },

  stopped: {
    label: '已停止',
    color: 'accent',
    icon: {
      fontIcon: 'stop',
    },
  },
} as const;
const deviceList = [
  {
    label: 'cpu',
    value: 'cpu',
    description: 'Windows+Linux通用',
  },
  {
    label: 'cuda',
    value: 'cuda',
    description: 'Windows+Linux上Nvida显卡使用',
  },
  {
    label: 'zluda',
    value: 'zluda',
    description: 'Windows上amd显卡使用',
  },
  {
    label: 'rocm',
    value: 'rocm',
    description: 'Linux上amd显卡使用',
  },
  {
    label: 'xpu',
    value: 'xpu',
    description: 'Windows+Linux上Intel显卡使用',
  },
] as const;
function createModelDownload(backend: string) {
  return v.pipe(
    v.object({
      [`__downloadModel-${backend}`]: v.pipe(
        NFCSchema,
        setComponent('button'),
        actions.inputs.patch({
          // shape: 'block',
          content: '下载模型',
        }),
        actions.class.top('!flex-none'),
        actions.inputs.patchAsync({
          clicked: (field) => {
            return async () => {
              return field.context['downloadIndexTTSModel'](backend);
            };
          },
        }),
      ),
      [`__progress-${backend}`]: createProgress({
        info: (field) => {
          return field.context['modelProgressObj$'][backend];
        },
      }),
    }),
    v.title(backend),
    asColumn(),
  );
}
@Component({
  selector: 'app-python-addon-install',
  templateUrl: './component.html',
  imports: [PiyingView],
})
export class PythonAddonInstallComponent implements OnInit {
  options = {
    fieldGlobalConfig: FieldGlobalConfig,
    context: this,
  };

  // 选择设备
  readonly dirLineDefine = v.pipe(
    v.object({
      ...FileLineDefine.entries,
      device: v.pipe(
        v.picklist(deviceList.map((item) => item.value)),
        selectOptions(deviceList),
        v.title('设备'),
        actions.class.top('!flex-none'),
      ),

      __update: v.pipe(
        NFCSchema,
        safeDefine.setComponent('button', (actions) => {
          return [
            actions.inputs.patch({
              // shape: 'block',
              content: '下载',
            }),
          ];
        }),

        actions.class.top('!flex-none'),
        actions.inputs.patchAsync({
          clicked: () => {
            return async () => {
              return this.downloadPythonAddon();
            };
          },
        }),
      ),
    }),
    asRow(),
  );
  #client = inject(TrpcService).client;
  #injector = inject(Injector);
  schema = v.pipe(
    v.intersect([
      v.pipe(
        v.object({
          host: v.pipe(v.string(), v.title('监听地址')),
          port: v.pipe(
            v.number(),
            v.title('监听端口'),
            actions.class.top('w-[100px]'),
          ),
          idleTime: v.pipe(v.number(), v.title('空闲超时(毫秒)')),
        }),
        asRow(),
      ),
      this.dirLineDefine,
      v.object({
        __progress: createProgress({
          info: (field) => {
            return field.context['progress$'];
          },
        }),
      }),
      v.pipe(
        v.intersect([
          createModelDownload('IndexTTS-1.5'),
          createModelDownload('IndexTTS-2'),
        ]),
        asVirtualGroup(),
        setComponent('card-group'),
        actions.props.patch({
          childrenWrapperClass: 'grid grid-cols-2 gap-2',
        }),
      ),
      v.object({}),
    ]),
    asColumn(),
  );
  progress$ = signal<ProgressInfo | undefined>(undefined);
  modelProgressObj$ = {
    'IndexTTS-1.5': signal<ProgressInfo | undefined>(undefined),
    'IndexTTS-2': signal<ProgressInfo | undefined>(undefined),
  };
  running$ = signal(false);
  #inited = 0;
  constructor() {}

  ngOnInit(): void {
    this.#client.environment.pythonAddon.status.subscribe(undefined, {
      onData: (value) => {
        this.running$.set(value.runningStatus === 1);
      },
    });
    this.#client.environment.pythonAddon.getConfig
      .query(undefined)
      .then((value) => {
        this.modelValue.set(value);
        this.#inited++;
      });
  }
  changePath(value?: string) {
    return this.#client.fs.selectFolder.query(value ?? '');
  }
  openFolder(file: string) {
    this.#client.fs.openFolder.query(file);
  }
  downloadPythonAddon() {
    return new Promise<void>((resolve, reject) => {
      this.progress$.set(StartDownloadMessage);
      this.#client.environment.pythonAddon.download.subscribe(
        { update: false },
        {
          onData: (value) => {
            this.progress$.set(value);
          },
          onComplete: () => {
            this.progress$.set(EndDownloadMessage);
            resolve();
          },
          onError: (err) => {
            this.progress$.set(ErrorDownloadMessage);
            reject(err);
          },
        },
      );
    });
  }
  downloadIndexTTSModel(backend: string) {
    const progress$ = (this.modelProgressObj$ as any)[
      backend
    ] as WritableSignal<any>;
    return new Promise<void>((resolve, reject) => {
      progress$.set(StartDownloadMessage);
      this.#client.environment.pythonAddon.downloadIndexTTSModel.subscribe(
        backend,
        {
          onData: (value) => {
            progress$.set(value);
          },
          onComplete: () => {
            progress$.set(EndDownloadMessage);
            resolve();
          },
          onError: (err) => {
            progress$.set(ErrorDownloadMessage);
            reject(err);
          },
        },
      );
    });
  }
  modelValue = signal({});
  modelValueChange(value: any) {
    if (this.#inited === 1) {
      this.#client.environment.pythonAddon.setConfig.query(value);
    }
  }
}
