import * as v from 'valibot';
import {
  asVirtualGroup,
  setComponent,
  hideWhen,
} from '@piying/view-angular-core';
import { PiResolvedViewFieldConfig } from '@piying/view-angular';
import { asColumn } from '@cyia/component/valibot-util';
import { actions } from '@piying/view-angular-core';
import { map } from 'rxjs';
import { safeDefine } from '@fe/piying/define';
const {
  inputs: { set: setInputs, patch: patchAsyncInputs },
  class: { top: topClass, component: componentClass },
} = actions;
const typeList = [
  { label: '文章', value: 'article' },
  { label: '节点', value: 'node' },
  // { label: '外部节点', value: 'ext-node' },
] as const;
export const Config = v.pipe(
  v.intersect([
    v.pipe(
      v.object({
        __delete: v.pipe(
          v.optional(v.void()),
          safeDefine.setComponent('button', (actions) => {
            return [
              actions.inputs.patch({
                color: 'error',
                content: { icon: { fontIcon: 'delete' } },
                shape: 'circle',
                style: 'ghost',
              }),
            ];
          }),

          patchAsyncInputs({
            clicked: (field: PiResolvedViewFieldConfig) => () => {
              field.context!.deleteNode();
            },
          }),
        ),
        __close: v.pipe(
          v.optional(v.void()),
          setComponent('button'),
          setInputs({
            color: 'error',
            content: { icon: { fontIcon: 'close' } },
            shape: 'circle',
            style: 'ghost',
          }),
          patchAsyncInputs({
            clicked: (field: PiResolvedViewFieldConfig) => () => {
              field.context!.deleteNode();
            },
          }),
        ),
        __flex: v.pipe(
          v.optional(v.void()),
          setComponent('empty'),
          topClass('flex-1'),
        ),
        __moveTo: v.pipe(
          v.optional(v.void()),
          safeDefine.setComponent('button', (actions) => {
            return [
              actions.inputs.patch({
                color: 'secondary',
                content: { icon: { fontIcon: 'center_focus_strong' } },
                shape: 'circle',
                style: 'ghost',
              }),
            ];
          }),

          patchAsyncInputs({
            clicked: (field: PiResolvedViewFieldConfig) => () => {
              field.context!.moveTo();
            },
          }),
        ),
        __save: v.pipe(
          v.optional(v.void()),
          setComponent('button'),
          setInputs({
            content: { icon: { fontIcon: 'check' } },
            shape: 'circle',
            style: 'ghost',
          }),
          patchAsyncInputs({
            clicked: (field: PiResolvedViewFieldConfig) => () => {
              field.context!.submit();
            },
          }),
        ),
      }),
      componentClass('flex'),
    ),
    v.pipe(
      v.object({
        type: v.pipe(
          v.optional(v.picklist(typeList.map((a) => a.value)), 'node'),
          actions.props.patch({ options: typeList }),
          v.title('类型'),
        ),
        nodeId: v.pipe(
          v.optional(v.string()),
          v.title('链接节点'),

          hideWhen({
            listen(fn) {
              return fn({ list: [['#', 'type']] }).pipe(
                map(({ list }) => list[0] !== 'node'),
              );
            },
          }),
          setComponent('picklist'),
          actions.inputs.patchAsync({
            options: (field) => {
              return field.context.getCardNode();
            },
          }),
        ),
        filePath: v.pipe(
          v.optional(v.string()),
          v.title('链接文件'),
          setComponent('file-input'),
          setInputs({
            mode: 'vscode',
            filterType: 'article',
          }),
          hideWhen({
            listen(fn) {
              return fn({ list: [['#', 'type']] }).pipe(
                map(({ list }) => list[0] !== 'article'),
              );
            },
          }),
        ),
      }),
      asColumn(),
    ),
  ]),
  asVirtualGroup(),
);
