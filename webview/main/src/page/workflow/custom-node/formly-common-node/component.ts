import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { BridgeService } from '../../service';
import { PiyingView, actions } from '@piying/view-angular';
import * as v from 'valibot';
import { CustomNode } from '../../type';
import { FormsModule } from '@angular/forms';
import { ValueFormatDirective } from '../../../../directive/value-format.directive';
import { deepEqual } from 'fast-equals';
import { NodeService } from './node.service';
import {
  ErrorSummary,
  getDeepError,
  toObservable,
} from '@piying/view-angular-core';

import { InputInvalidItem, InputRefItem } from '@bridge/share';
import { CreateSchemaHandle } from './schema-handle';
import '@valibot/i18n/zh-CN';
import { unset } from 'es-toolkit/compat';
import { forEachErrorSummary } from './error-handle';
import { FieldGlobalConfig } from '../../define/field-global-config';
import { skip } from 'rxjs';
v.setGlobalConfig({ lang: 'zh-CN' });

@Component({
  selector: 'formly-common-node',
  templateUrl: './component.html',
  styleUrl: './component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PiyingView, FormsModule, ValueFormatDirective],
  providers: [NodeService],
})
export class FormlyCommonNodeComponent {
  define = input<v.BaseSchema<any, any, any>>();
  props = input.required<CustomNode>();
  #service = inject(BridgeService);
  model$$ = computed(
    () => {
      return this.props().data.config?.value;
    },
    { equal: deepEqual },
  );
  schema$$ = computed(() => {
    const define = this.define();
    if (!define) {
      return;
    }
    return v.pipe(
      define,
      actions.hooks.merge({
        allFieldsResolved: (field) => {
          const data$$ = computed(() => {
            return field.form.root.getRawValue(1);
          });
          toObservable(data$$, data$$, {
            injector: field.form.root.injector,
          })
            .pipe(skip(1))
            .subscribe((value) => {
              const status = field.form.root.status$$();
              const invalidList: InputInvalidItem[] = [];
              if (status === 'INVALID') {
                const list = getDeepError(field.form.root);
                this.errorList.set(list);
                if (value) {
                  forEachErrorSummary(list, (summary) => {
                    const lastField = summary.fieldList.slice(-1)[0];
                    unset(value, lastField.valuePath);
                    invalidList.push({ key: lastField.valuePath });
                  });
                }
              } else {
                this.errorList.set([]);
              }
              this.#bridge.patchDataConfigOne(this.props().id, {
                value,
                invalidList,
              });
            });
        },
      }),
    );
  });
  errorList = signal<ErrorSummary[]>([]);
  errorList$$ = computed(() => {
    const refList = this.props().data.config?.refList ?? [];
    const contextList =
      Object.values(this.props().data.config?.contextGroup ?? []).flat() ?? [];
    const list = [...refList, ...contextList];
    return this.errorList()
      .filter((item) => {
        return list.every((item2) => !deepEqual(item2.key, item.queryPathList));
      })
      .map((item) => {
        return `${item.debugPathList.join('.')}:${item.valibotIssueSummary}`;
      });
  });
  nodeService = inject(NodeService);
  children = computed(() => {
    return this.nodeService.nodeList$();
  });
  #bridge = inject(BridgeService);
  context = this.#bridge.context;
  options = {
    context: {
      ...this.context,
      setOutputHandle: (index: number, list: any[]) => {
        const data = this.props().data;
        data.handle ??= { output: [] };
        data.handle.output ??= [];
        data.handle!.output[index] ??= [];
        data.handle!.output[index] ??= list;
        this.#bridge.patchDataOne(this.props().id, { handle: data.handle });
      },
      setContextList: (key: any[], value: any) => {
        const config = this.props().data.config ?? {};
        config.contextGroup ??= {};
        config.contextGroup[key.join('-')] = value;
      },
    },
    fieldGlobalConfig: FieldGlobalConfig,
    handle: CreateSchemaHandle,
  };

  constructor() {
    this.nodeService.props$ = this.props;
    const id$$ = computed(() => this.props().id);
    effect(() => {
      const nodeIdSet = this.nodeService.nodeIdSet$();
      const refList: InputRefItem[] = [];
      const obj = this.#bridge.edgeTargetObj$$()[id$$()];
      nodeIdSet.forEach((field$$, key) => {
        const field = field$$();
        const item = obj?.[key];
        if (!item) {
          return;
        }
        refList.push({
          value: item.source,
          key: field.form.control!.valuePath,
          outlet: item.sourceHandle ?? undefined,
        });
      });
      untracked(() => {
        this.#service.patchDataConfigOne(id$$(), { refList });
      });
    });
  }
}
