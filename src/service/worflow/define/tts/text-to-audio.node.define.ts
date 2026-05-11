import * as v from 'valibot';
import {
  actions,
  condition,
  setComponent,
  valueChange,
} from '@piying/view-angular-core';
import { ChatMessageListInputType } from '@shenghuabi/openai';
import { Reference } from '../../../../share/define';
export const ResponseList = ['json', 'markdown', 'yaml'] as const;
export const ResponseFormat = ['text', 'json_object', 'json_schema'] as const;
export type ResponseType = (typeof ResponseList)[number];
export const TEXT_TO_AUDIO_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.pipe(
      v.object({
        reference: Reference,
      }),
      actions.wrappers.patch([
        { type: 'div', attributes: { class: 'grid auto-rows-auto gap-2' } },
      ]),
    ),
    value: v.pipe(
      v.optional(v.string(), '{{input}}'),
      setComponent(''),
      condition({
        environments: ['display'],
        actions: [
          setComponent('string'),
          valueChange((fn) => {
            fn({}).subscribe(({ list: [value], field }) => {
              const inputValue: ChatMessageListInputType = value ?? '';
              field.context.parseTemplate(inputValue).then((value: any) => {
                if (!value) {
                  return;
                }
                field.context.changeHandleData(field, 'input', 1, value);
              });
            });
          }),
        ],
      }),
    ),
  }),
});
