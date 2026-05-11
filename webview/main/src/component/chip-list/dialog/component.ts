import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { deepClone } from '@bridge/share';
import { PiyingView, NgSchemaHandle, actions } from '@piying/view-angular';
import { asVirtualGroup } from '@piying/view-angular';
// import { componentDefine } from '@share/valibot';
import * as v from 'valibot';
import {
  CommonDefine,
  DefaultCommonConfig,
  ExampleSpecificDefine,
  ExecDefine,
  SamplingDefine,
} from '@shenghuabi/llama/define';

import { ObjectSchema, Schema } from '@piying/valibot-visit';
import { merge, of } from 'rxjs';
import { TrpcService } from '@fe/trpc';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { FieldGlobalConfig } from '@fe/form/default-type-config';
import clsx from 'clsx';
import { setAlias, setComponent } from '@piying/view-angular-core';
const keyTypeList = ['string', 'number', 'picklist'];
const priorityList = [
  'hf-repo',
  'hf-file',
  'model',
  'model-url',
  'flash-attn',
  'gpu-layers',
];
class DefineSchema extends NgSchemaHandle {
  override objectSchema(schema: ObjectSchema): void {
    const list = Object.keys(schema.entries);

    super.objectSchema(schema);
    if (list.length > 2) {
      this.wrappers ??= [];
      this.wrappers.push({
        type: 'div',
        inputs: {},
        outputs: {},
        attributes: { class: 'grid gap-2' },
        events: {},
        slots: {},
      });
    }
    if (
      ((list.length === 2 && list[0] === 'enable' && list[1] === 'value') ||
        (list.length === 1 && list[0] === 'enable')) &&
      this.key
    ) {
      const key = Array.isArray(this.key) ? this.key[0] : this.key;
      if (typeof key === 'string') {
        if (priorityList.includes(key)) {
          this.priority = -1;
        }
      }
      this.props ??= [];

      this.wrappers ??= [];

      const chilren = this.children!;
      const enable = chilren[0];

      enable.attributes ??= {};
      enable.attributes['class'] = clsx(
        enable.attributes['class'],
        '!flex-none',
      );
      if (this.props['description']) {
        this.wrappers.push({
          type: 'tooltip',
          inputs: {},
          outputs: {},
          attributes: {},
          events: {},
          slots: {},
        });
      }
      this.wrappers.push({
        type: 'label',
        inputs: {},
        outputs: {},
        attributes: {},
        events: {},
        slots: {},
      });
      this.props['title'] = this.key;
      this.wrappers.push({
        type: 'div',
        inputs: {},
        outputs: {},
        attributes: { class: 'flex gap-2 items-center *:nth-2:flex-1' },
        events: {},
        slots: {},
      });

      if (list.length === 2) {
        const valueChild = chilren[1];

        valueChild.hooks = {
          allFieldsResolved: (field) => {
            const enableForm = field.get(['..', 'enable'])?.form.control!;
            merge(of(enableForm.value), enableForm.valueChanges).subscribe(
              (status) => {
                // 防止打扰到同步的更新
                setTimeout(() => {
                  field.formConfig.update((item) => {
                    return { ...item, disabled: !status };
                  });
                }, 0);
              },
            );
          },
        };
      }
    }
  }

  override afterSchemaType(schema: Schema): void {
    if (this.props?.['metadata']?.['name'] === 'llamaExec') {
      this.attributes ??= {};
      this.attributes['class'] = clsx(
        this.attributes['class'],
        'flex gap-2 items-center *:flex-1',
      );
    } else if (schema.type === 'picklist') {
      if (this.props?.['metadata']?.type === 'toggle') {
        this.type = 'toggle';
        this.inputs ??= {
          labelFn: (value: boolean) => (value ? '开启' : '关闭'),
          transformer: {
            input: (value: number) => value === 1,
            output: (value: boolean) => (value ? 1 : 0),
          },
        };
      } else if (this.props?.['metadata']?.enumOptions) {
        this.props['options'] = this.props?.['metadata']?.enumOptions;
      }
      if (this.props?.['options'] && this.type === 'picklist') {
        const hasObject = this.props['options']?.some(
          (item: any) => typeof item === 'object',
        );
        this.props['options'] = hasObject
          ? this.props['options']
          : this.props['options'].map((item: any) => {
              return { label: item, value: item };
            });
      }
    } else if (this.type === 'tuple') {
      this.attributes ??= {};
      this.attributes['class'] = clsx(
        this.attributes['class'],
        'flex gap-2 items-center *:flex-1',
      );
    }
    // if (
    //   this.props?.['description'] &&
    //   this.type &&
    //   keyTypeList.includes(this.type)
    // ) {
    //   this.inputs = {
    //     placeholder: this.props?.['description'],
    //   };
    // }
    if (this.props?.['metadata']?.type === 'llamaConfig') {
      this.type = 'search-group';
    }
    super.afterSchemaType(schema);
  }
}

/**
 * 第一层,card类型?/group类型
 * 第二层普通的一行,object checkbox [xxx]
 *
 */
@Component({
  selector: 'cyia-llama-model-config-dialog',
  templateUrl: './component.html',
  providers: [],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    PiyingView,
    MatProgressBarModule,
    MatCheckboxModule,
    FormsModule,
  ],

  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LlamaModelConfigDialogNFCC {
  #client = inject(TrpcService).client;

  data = inject(MAT_DIALOG_DATA);
  config = deepClone(this.data.config);
  ref = inject(MatDialogRef);
  define = v.pipe(
    v.object({
      model: v.pipe(v.string(), v.title('模型名'), v.trim()),
      exec: v.pipe(ExecDefine, v.metadata({ name: 'llamaExec' })),
      config: v.pipe(
        v.intersect([
          v.pipe(
            v.optional(
              v.object({
                common: v.pipe(
                  CommonDefine,
                  v.metadata({ type: 'llamaConfig' }),
                ),
              }),
            ),
            v.title('Common'),
          ),
          v.pipe(
            v.optional(
              v.object({
                exampleSpecific: v.pipe(
                  ExampleSpecificDefine,
                  v.metadata({ type: 'llamaConfig' }),
                ),
              }),
            ),
            v.title('ExampleSpecificDefine'),
          ),
          v.pipe(
            v.optional(
              v.object({
                sampling: v.pipe(
                  SamplingDefine,
                  v.metadata({ type: 'llamaConfig' }),
                ),
              }),
            ),
            v.title('Sampling'),
          ),
        ]),
        asVirtualGroup(),
        setComponent('tabs'),
        actions.inputs.patch({
          type: 'lift',
        }),
        setAlias('tabGroup'),
      ),
    }),
  );
  schema = this.define;
  options = {
    handle: DefineSchema as any,
    fieldGlobalConfig: FieldGlobalConfig,
  };
  model$ = signal(
    this.config ??
      ({
        model: '',
        exec: { device: 'vulkan', version: this.data.llamaVersion },
        config: {
          common: {
            ...DefaultCommonConfig,
          },
        },
      } as v.InferOutput<typeof this.define>),
  );
  #commonDefine$$ = computed(() => {
    return { ...this.model$().config?.common };
  });
  downloadModelObj$$ = computed(() => {
    const model = this.#commonDefine$$();
    if (!model) {
      return undefined;
    }

    if (
      !model?.['hf-file']?.enable &&
      model?.['hf-repo']?.enable &&
      model?.['hf-repo']?.value?.[0]
    ) {
      return { repo: model?.['hf-repo']?.value[0] };
    } else if (
      model?.['hf-file']?.enable &&
      model?.['hf-file']?.value?.[0] &&
      model?.['hf-repo']?.enable &&
      model?.['hf-repo']?.value?.[0]
    ) {
      return {
        repo: model?.['hf-repo']?.value[0],
        fileName: model?.['hf-file']?.value[0],
      };
    } else if (
      model?.['model-url']?.enable &&
      model?.['model-url']?.value?.[0]
    ) {
      return {
        url: model?.['model-url']?.value[0],
      };
    }

    return undefined;
  });
  // 增加模型下载
  // 下载后返回文件路径加入到model中
  ngOnInit(): void {}
  close() {
    const model = this.model$();
    for (const key1 in model.config) {
      for (const key2 in (model.config as any)[key1]) {
        if (!(model.config as any)?.[key1]?.[key2]?.enable) {
          if ((model.config as any)?.[key1]?.[key2]) {
            delete (model.config as any)?.[key1]?.[key2];
          }
        }
      }
    }
    this.ref.close({
      value: this.model$(),
      action: this.config ? 'change' : 'create',
    });
  }
  downloading$ = signal(false);
  downloadingProgress$ = signal(0);
  downloadModel() {
    this.downloading$.set(true);
    this.downloadingProgress$.set(0);
    const data = this.downloadModelObj$$()!;

    this.#client.environment.llamaSwap.downloadModel.subscribe(
      { ...data, vendor: undefined },
      {
        onData: (result) => {
          if (result.type === 'end') {
            this.model$.update((value) => {
              return {
                ...value,
                model: value.model || data.fileName || data.repo || data.url,
                config: {
                  ...value.config,
                  common: {
                    ...value.config?.common,
                    model: {
                      enable: true,
                      value: [result.value],
                    },
                  },
                },
              };
            });
          } else {
            if (typeof result.value === 'number') {
              this.downloadingProgress$.set(result.value);
            }
          }
        },
        onComplete: () => {
          this.downloading$.set(false);
        },
        onError: () => {
          this.downloading$.set(false);
        },
      },
    );
  }
  valueChange(value: any) {
    this.model$.set({ ...value });
  }
  // deleteItem() {
  //   this.ref.close({ action: 'delete' });
  // }
}
