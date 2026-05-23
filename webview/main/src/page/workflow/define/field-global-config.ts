import { InputContextItem } from '@bridge/share';
import { TextareaTemplateFCC } from '@fe/component/textarea-template/component';
import { PromptListFCC } from '@fe/form/control/prompt-list/component';
import { safeDefine } from '@fe/piying/define';
import { PiViewConfig } from '@piying/view-angular';
import { outputChange } from '@piying/view-angular-core';
import * as v from 'valibot';
import { ChatVariable } from '../../../type/chat-variable';
import { HandleWC } from '../wrapper/handle/component';
import { UseRefWC } from '../wrapper/use-ref/component';
import { FormWrappers } from './node-form';
import {
  Editor,
  extractVariableItems,
  restoreEditorState,
  SimpleVariableNode,
  simplifyEditorState,
} from '@shenghuabi/lexical-textarea';
export const FieldGlobalConfig = {
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
