import * as v from 'valibot';
import { actions } from '@piying/view-angular-core';
import { Reference } from '../../../../share/define';
export const ResponseList = ['json', 'markdown', 'yaml'] as const;
export const ResponseFormat = ['text', 'json_object', 'json_schema'] as const;
export type ResponseType = (typeof ResponseList)[number];
export const TEXT_TO_AUDIO_DEFINE = v.pipe(
  v.object({
    reference: Reference,
    value: v.pipe(v.optional(v.string(), '{{input}}')),
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid auto-rows-auto gap-2' } },
  ]),
);
