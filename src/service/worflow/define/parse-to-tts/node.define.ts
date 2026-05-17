import { asColumn } from '@share/valibot';
import * as v from 'valibot';
import {
  actions,
  condition,
  valueChange,
  setComponent,
} from '@piying/view-angular-core';
export const ResponseList = ['json', 'markdown', 'yaml'] as const;
export const ResponseFormat = ['text', 'json_object', 'json_schema'] as const;
export type ResponseType = (typeof ResponseList)[number];

export const PARSE_TO_TTS_DEFINE = v.looseObject({
  data: v.pipe(
    v.looseObject({
      filePath: v.pipe(
        v.optional(v.string(), '{{input.filePath}}'),
        actions.class.top('nodrag'),
        valueChange((fn) => {
          fn({ list: [undefined] }).subscribe(({ list: [value], field }) => {
            if (typeof value !== 'string') {
              return;
            }
            field.context.parseTemplate([value]).then((value: any) => {
              if (!value) {
                return;
              }
              // field.context.changeHandleData(field, 'input', 1, value);
            });
          });
        }),
      ),
      content: v.pipe(
        v.optional(v.string(), '{{input.content}}'),
        actions.class.top('nodrag'),
 
      ),
    }),
    asColumn(),
  ),
});
