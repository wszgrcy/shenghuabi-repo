import * as v from 'valibot';
import {
  _PiResolvedCommonViewFieldConfig,
  NFCSchema,
  setComponent,
  actions,
} from '@piying/view-angular-core';
import { Signal } from '@angular/core';
import { ProgressInfo } from './progress/component';
import { safeDefine } from '@fe/piying/define';
export const StartDownloadMessage = { message: '开始下载' };
export const EndDownloadMessage = { type: 'end' };
export const ErrorDownloadMessage = { type: 'error' };

export const FileLineDefine = v.object({
  dir: v.pipe(
    v.optional(v.string()),
    setComponent('file-input'),
    actions.inputs.set({
      label: '保存位置',
      placeholder: '请输入文件夹路径',
    }),
    actions.inputs.patchAsync({
      clicked: (field) => () => {
        const data = field.form.control?.value;
        return field.context['changePath'](data);
      },
    }),
    actions.class.top('flex-1'),
  ),
  __openDir: v.pipe(
    NFCSchema,
    safeDefine.setComponent('button', (actions) => {
      return [
        actions.inputs.set({
          content: { icon: { fontIcon: 'folder_open' } },
          color: 'primary',
          shape: 'circle',
          style: 'ghost',
        }),
      ];
    }),
    actions.class.top('!flex-none'),
    actions.inputs.patchAsync({
      clicked: (field) => () => {
        const data = field.get(['..', 'dir'])?.form.control?.value;
        return field.context['openFolder'](data);
      },
    }),
  ),
});

export function createProgress(inputs: {
  info: (field: _PiResolvedCommonViewFieldConfig) => Signal<ProgressInfo>;
}) {
  return v.pipe(
    NFCSchema,
    setComponent('progress'),
    actions.inputs.set({
      color: 'primary',
    }),
    actions.inputs.patchAsync({
      info: inputs.info,
    }),
  );
}
