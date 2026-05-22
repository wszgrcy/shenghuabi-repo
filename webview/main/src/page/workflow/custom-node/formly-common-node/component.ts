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
import { PiyingView, PiViewConfig, actions } from '@piying/view-angular';
import { FormWrappers } from '../../define/node-form';
import { asVirtualGroup } from '@piying/view-angular';
import { Displayhandle } from '../../define/handle/display.handle';
import * as v from 'valibot';
import { CustomNode } from '../../type';
import { FormsModule } from '@angular/forms';
import { ValueFormatDirective } from '../../../../directive/value-format.directive';
import { deepEqual } from 'fast-equals';
import { DefaultFormTypes } from '@fe/form/default-type-config';
import { HandleWC } from '../../wrapper/handle/component';
import { UseRefWC } from '../../wrapper/use-ref/component';
import { NodeService } from './node.service';
import { safeDefine } from '@fe/piying/define';
import { PromptListFCC } from '@fe/form/control/prompt-list/component';
import { TextareaTemplateFCC } from '@fe/component/textarea-template/component';
import {
  ErrorSummary,
  getDeepError,
  outputChange,
  toObservable,
  valueChange,
} from '@piying/view-angular-core';
import {
  Editor,
  extractVariableItems,
  restoreEditorState,
  SimpleVariableNode,
  simplifyEditorState,
} from '@shenghuabi/lexical-textarea';
import { ChatVariable } from '../../../../type/chat-variable';
import { InputContextItem, InputRefItem } from '@bridge/share';
import { CreateSchemaHandle } from './schema-handle';
import '@valibot/i18n/zh-CN';
import { unset } from 'es-toolkit/compat';
import { forEachErrorSummary } from './error-handle';
v.setGlobalConfig({ lang: 'zh-CN' });
const FieldGlobalConfig = {
  types: {
    ...safeDefine.define.types,
    'prompt-list': {
      type: PromptListFCC,
      actions: [
        outputChange((fn) => {
          fn([{ list: undefined, output: 'variableChange' }]).subscribe(
            ({ list: [[value]], field }) => {
              field.context['setContextList'](
                field.form.control!.fieldPath,
                (value as ChatVariable[]).map((item) => {
                  return {
                    label: item.label,
                    key: item.value,
                    kind: item.kind,
                  } as InputContextItem;
                }),
              );
            },
          );
        }),
      ],
    },
    'textarea-template': {
      type: TextareaTemplateFCC,
      actions: [
        outputChange((fn) => {
          fn([{ list: undefined, output: 'variableChange' }]).subscribe(
            ({ list: [[value]], field }) => {
              let list: SimpleVariableNode['item'][] = value.custom;
              field.context['setContextList'](
                field.form.control!.fieldPath,
                list.map((item) => {
                  return {
                    label: item.label,
                    key: item.value,
                  } as InputContextItem;
                }),
              );
            },
          );
        }),
      ],
    },
  },
  wrappers: {
    ...FormWrappers,
    'flow-handle': { type: HandleWC },
    'use-ref': { type: UseRefWC },
  },
} as PiViewConfig;
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
          let data$$ = computed(() => {
            return field.form.root.getRawValue(1);
          });
          toObservable(data$$, data$$, {
            injector: field.form.root.injector,
          }).subscribe((value) => {
            let status = field.form.root.status$$();
            if (status === 'INVALID') {
              let list = getDeepError(field.form.root);
              this.errorList.set(list);
              if (value) {
                forEachErrorSummary(list, (summary) => {
                  unset(value, summary.fieldList.slice(-1)[0].valuePath);
                });
              }
            } else {
              this.errorList.set([]);
            }
            let oldValue = this.props().data.config?.value;
            if (!deepEqual(oldValue, value)) {
              this.#bridge.patchDataOne(this.props().id, {
                ...this.props().data.config,
                config: value,
              });
            }
          });
        },
      }),
    );
  });
  errorList = signal<ErrorSummary[]>([]);
  errorList$$ = computed(() => {
    let refList = this.props().data.config?.refList ?? [];
    let contextList =
      Object.values(this.props().data.config?.contextGroup ?? []).flat() ?? [];
    let list = [...refList, ...contextList];
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
        let data = this.props().data;
        data.handle ??= { output: [] };
        data.handle.output ??= [];
        data.handle!.output[index] ??= [];
        data.handle!.output[index] ??= list;
        this.#bridge.patchDataOne(this.props().id, { handle: data.handle });
      },
      setContextList: (key: any[], value: any) => {
        let config = this.props().data.config ?? {};
        config.contextGroup ??= {};
        config.contextGroup[key.join('-')] = value;
      },
    },
    fieldGlobalConfig: FieldGlobalConfig,
    handle: CreateSchemaHandle,
  };

  constructor() {
    this.nodeService.props$ = this.props;
    let id$$ = computed(() => this.props().id);
    effect(() => {
      let nodeIdSet = this.nodeService.nodeIdSet$();
      let refList: InputRefItem[] = [];
      let obj = this.#bridge.edgeTargetObj$$()[id$$()];
      nodeIdSet.forEach((field$$, key) => {
        let field = field$$();
        let item = obj?.[key];
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
        this.#service.patchDataOne(id$$(), {
          config: { ...this.props().data.config, invalidList: refList },
        });
      });
    });
  }
}
