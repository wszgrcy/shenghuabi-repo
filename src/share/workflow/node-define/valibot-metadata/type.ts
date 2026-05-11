import type {
  PiResolvedViewFieldConfig,
  NgSchemaHandle,
} from '@piying/view-angular';
import type {
  DisabledValueStrategy,
  FieldFormConfig,
} from '@piying/view-angular-core';
import type { KeyPath } from '@piying/view-angular-core';
import { BaseMetadata } from 'valibot';
import { PluginComponentType } from '../../../component/define';

export interface SelectOption {
  readonly label?: string;
  readonly value: any;
  readonly description?: string;
  /** 样式代替label */
  readonly style?: any;
}
export interface ComponentDefineOption {
  type?: string;
  alias?: string;
  inputs?: Record<string, any> | ((context: any) => Record<string, any>);
  props?: Record<string, any>;
  wrappers?: any[];
  hidden?: boolean;
}
export type HookDefineOption = NgSchemaHandle['hooks'];
export interface HideWhenOption {
  disabled?: boolean;
  disabledValue?: DisabledValueStrategy;
  list: (KeyPath | undefined)[];
  when: (list: any[], field: PiResolvedViewFieldConfig) => boolean;
}
export interface DisableWhenOption {
  disabledValue?: DisabledValueStrategy;
  list: (KeyPath | undefined)[];
  when: (list: any[], field: PiResolvedViewFieldConfig) => boolean;
}
export interface ChangeWhenOption {
  debounceTime?: number;
  list: (KeyPath | undefined)[];
  when: (list: any[], field: PiResolvedViewFieldConfig) => void;
}

export type FormDefineOption = FieldFormConfig;

export interface ConditionOption<T> {
  environments: string[];
  actions: (BaseMetadata<T> & { value: any })[];
}

export type DefineOption = {
  alias?: string;
  hidden?: boolean;
} & PluginComponentType;
