import type { LayoutAction } from '@piying/view-angular-core';
import {
  ComponentDefineOption,
  ConditionOption,
  DefineOption,
  FormDefineOption,
  HookDefineOption,
  SelectOption,
} from '../workflow/node-define/valibot-metadata/type';
const NOOP_DEFINE = {
  kind: 'metadata',
  type: '',
  reference: undefined,
  metadata: undefined,
} as any;
export type NoopAction<T> = LayoutAction<T>;
export function selectOptions<TInput>(options?: readonly SelectOption[]) {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}
export function componentDefine<TInput>(input: ComponentDefineOption) {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}
export function hookDefine<TInput>(input: HookDefineOption) {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}

export function formDefine<TInput>(input: FormDefineOption) {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}
export function onlyDefine<TInput>() {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}
export function asRow<TInput>(count?: number) {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}
export function asColumn<TInput>() {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}
export function condition<TInput>(input: ConditionOption<TInput>) {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}

export function define<TInput>(input: DefineOption) {
  return NOOP_DEFINE as any as NoopAction<TInput>;
}
