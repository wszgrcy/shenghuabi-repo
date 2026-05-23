import * as v from 'valibot';
import { EXAMPLES_DEFINE } from '../../../../../share/workflow/node-define/common/examples.define';
import { llmModelConfig } from '../../../../../share/workflow/node-define/common/llm.define';
import { stringify } from 'yaml';
import {
  actions,
  asVirtualGroup,
  formConfig,
  renderConfig,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { debounceTime, filter } from 'rxjs';
import { TextareaTemplateDefine } from '@shenghuabi/workflow/share';

const examples1 = {
  categories: [
    '与请客相关的问题',
    '与斩首相关的问题',
    '与收下当狗相关的问题',
    '其他问题',
  ],
  input_text: '今天有空去我家吃点？',
};
const answer1 = { category_name: examples1.categories[0] };
const examples2 = {
  categories: ['高兴', '愤怒', '抱怨'],
  input_text: '我再也不去这家店买东西了，他家的服务真差',
};
const answer2 = { category_name: examples2.categories[1] };

export const CATEGORY_NODE_DEFINE = v.pipe(
  v.intersect([
    v.pipe(v.object({ llm: v.optional(llmModelConfig()) })),
    v.object({
      categories: v.pipe(
        v.optional(
          v.array(
            v.pipe(
              v.object({
                value: v.pipe(TextareaTemplateDefine, v.title('分类依据')),
              }),
            ),
          ),
          [],
        ),

        v.minLength(1),
        v.title('分类'),
        v.description('根据分类依据进行不同问题的分类'),
        // todo , 禁用添加
        formConfig({
          emptyValue: [],
        }),
        setComponent('editable-group'),
        actions.inputs.set({
          minLength: 1,
          layout: 'column',
        }),
        valueChange((fn) => {
          fn().subscribe(({ list: [value], field }) => {
            value ??= [];
            field.context.setOutputHandle(
              0,
              (value as any[]).map((item, index) => {
                return { label: item.value, value: `${index}` };
              }),
            );
          });
        }),
      ),
      examples: v.optional(EXAMPLES_DEFINE, [
        {
          input: { value: stringify(examples1) },
          output: { value: stringify(answer1) },
        },
        {
          input: { value: stringify(examples2) },
          output: { value: stringify(answer2) },
        },
      ]),
      systemPrompt: TextareaTemplateDefine,
      content: TextareaTemplateDefine,
    }),
  ]),
  asVirtualGroup(),
);
