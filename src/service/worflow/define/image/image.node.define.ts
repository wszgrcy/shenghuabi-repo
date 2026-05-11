import * as v from 'valibot';
import { formDefine, selectOptions } from '@share/valibot';
import {
  actions,
  asControl,
  condition,
  setComponent,
} from '@piying/view-angular-core';
import { IMAGE_SUFFIX } from '../../../const';
const formatList = [{ value: 'chat_base64', label: 'base64编码' }] as const;
export const IMAGE_NODE_DEFINE = v.looseObject({
  data: v.looseObject({
    config: v.object({
      // todo 子级禁用导致的父级禁用,然后父级自动恢复
      format: v.pipe(
        v.optional(
          v.picklist(formatList.map((item) => item.value)),
          'chat_base64',
        ),
        selectOptions(formatList),
        v.title('格式化'),
        formDefine({ disabled: true }),
      ),
    }),
    value: v.pipe(
      v.optional(v.array(v.string()), []),
      v.minLength(1),
      v.title('图片'),
      asControl(),
      setComponent(''),
      condition({
        environments: ['display'],
        actions: [
          asControl(),
          setComponent('file-input'),
          actions.inputs.set({
            mode: 'file',
            icon: 'image',
            multi: true,
            label: `选择图片`,
            filters: {
              [`图片`]: IMAGE_SUFFIX,
            },
          }),
        ],
      }),
    ),
  }),
});
