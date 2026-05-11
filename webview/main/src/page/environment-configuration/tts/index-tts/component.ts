import { Component, inject, OnInit, signal } from '@angular/core';

import { FieldGlobalConfig } from '@fe/form/default-type-config';
import { TrpcService } from '@fe/trpc';

import * as v from 'valibot';
import { asColumn } from '@cyia/component/valibot-util';
import { asControl, PiyingView } from '@piying/view-angular';
import { IndexTTSOptionsDefine } from '@shenghuabi/python-addon/define';
import { SpeedControlDefine } from '@shenghuabi/crunker/define';
import { DefineSchemaHandle } from '@fe/form/schema-handle/define.schema-handle';
import {
  actions,
  asVirtualGroup,
  setComponent,
} from '@piying/view-angular-core';
import { BackendDefine } from '@shenghuabi/python-addon/define';
const valueMapFn = (value: any[]) => {
  return value?.map((item) => item.name).join(',') ?? `[空]`;
};
@Component({
  selector: 'app-indexTTS',
  templateUrl: './component.html',
  imports: [PiyingView],
})
export class IndexTTSComponent implements OnInit {
  commonOptions = {
    fieldGlobalConfig: FieldGlobalConfig,
    handle: DefineSchemaHandle as any,
    context: this,
  };

  #client = inject(TrpcService).client;
  #commonSchema = v.object({
    backend: BackendDefine,
    paragraphInterval: v.pipe(v.optional(v.number()), v.title('段落间隔(秒)')),
    sentenceInterval: v.pipe(v.optional(v.number()), v.title('分句间隔(秒)')),
    speedControl: v.pipe(v.optional(SpeedControlDefine), asColumn()),
    plugin: v.pipe(
      v.optional(
        v.object({
          activatedChangeAudioItemList: v.pipe(
            v.optional(v.array(v.object({ name: v.string() }))),
            asControl(),
            v.title('已激活的音频项处理插件'),
            setComponent('select2'),
            actions.props.patch({ multiple: true, options: [], valueMapFn }),
            actions.props.patchAsync({
              options: (field) => {
                return field.context['getChangeAudioItemList']();
              },
            }),
          ),
          activatedBeforeConcatList: v.pipe(
            v.optional(v.array(v.object({ name: v.string() }))),
            asControl(),
            v.title('已激活的合并前处理插件'),
            setComponent('select2'),
            actions.props.patch({ multiple: true, options: [], valueMapFn }),
            actions.props.patchAsync({
              options: (field) => {
                return field.context['getBeforeConcatList']();
              },
            }),
          ),
          activatedAfterConcatList: v.pipe(
            v.optional(v.array(v.object({ name: v.string() }))),
            asControl(),
            v.title('已激活的合并后处理插件'),
            setComponent('select2'),
            actions.props.patch({ multiple: true, options: [], valueMapFn }),
            actions.props.patchAsync({
              options: async (field) => {
                return field.context['getAfterConcatList']();
              },
            }),
          ),
        }),
      ),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid gap-2' } },
      ]),
    ),
  });

  readonly Define = v.pipe(
    v.intersect([
      v.pipe(
        v.object({ common: v.pipe(this.#commonSchema, asColumn()) }),
        v.title('通用设置'),
      ),
      v.pipe(
        v.object({
          indextts: v.pipe(
            IndexTTSOptionsDefine,
            setComponent('tabs'),
            actions.inputs.patch({
              type: 'lift',
            }),
            // asColumn(),
          ),
        }),
        v.title('IndexTTS设置'),
      ),
    ]),
    setComponent('card-group'),
    asVirtualGroup(),
  );
  model$ = signal({});

  #initedIndex$ = 0;

  ngOnInit(): void {
    this.#client.environment.tts.getConfig.query(undefined).then((value) => {
      this.model$.set(value);
      this.#initedIndex$++;
    });
  }

  modeChanged(value: any) {
    if (this.#initedIndex$ === 1) {
      this.#client.environment.tts.setConfig.query(value);
    }
  }
  getChangeAudioItemList() {
    return this.#client.environment.tts.getChangeAudioItemList
      .query(undefined)
      .then((list) => {
        return list.map((item) => {
          return {
            label: item,
            value: { name: item },
          };
        });
      });
  }
  getBeforeConcatList() {
    return this.#client.environment.tts.getBeforeConcatList
      .query(undefined)
      .then((list) => {
        return list.map((item) => {
          return {
            label: item,
            value: { name: item },
          };
        });
      });
  }
  getAfterConcatList() {
    return this.#client.environment.tts.getAfterConcatList
      .query(undefined)
      .then((list) => {
        return list.map((item) => {
          return {
            label: item,
            value: { name: item },
          };
        });
      });
  }
}
// 下载解压前应该删除,不是覆盖
