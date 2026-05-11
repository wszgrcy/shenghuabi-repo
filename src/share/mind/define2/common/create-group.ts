import {
  actions,
  asVirtualGroup,
  setComponent,
} from '@piying/view-angular-core';
import * as v from 'valibot';
import { noKey } from './void.schema';
export const RowClass = ['flex', 'items-center', 'gap-2'];
export const RowGrid2Class = ['grid', 'items-center', 'gap-2', 'grid-cols-2'];
export const ColClass = ['grid', 'gap-2'];

export function createEnable(label: string) {
  return v.pipe(
    v.optional(v.boolean(), false),
    v.title(label),
    actions.class.top('flex-1'),
    actions.props.patch({ labelPosition: 'right' }),
  );
}
export const ResetSchema = v.pipe(noKey, setComponent('reset-button'));

type ListToTuple<T> = {
  [K in keyof T]: T[K];
};
export function createGroup<
  List extends readonly (
    | v.BaseSchema<any, any, any>
    | v.SchemaWithPipe<[v.BaseSchema<any, any, any>]>
  )[],
>(list: readonly [...ListToTuple<List>], options?: { cardWrapper?: boolean }) {
  return v.pipe(
    v.optional(v.intersect(list)),
    asVirtualGroup(),
    actions.wrappers.set(options?.cardWrapper ? ['card'] : []),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: 'grid gap-2' } },
    ]),
  );
}
