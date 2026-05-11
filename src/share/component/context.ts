import type { KeyPath } from '@piying/view-angular-core';

export interface ComponentContext {
  changeHandleByTemplate: (
    field: any,
    value: string,
    index: number,
  ) => Promise<void>;
  parseTemplate: (
    value: string,
    language?: 'js' | 'plaintext' | 'liquid',
  ) => Promise<
    | {
        label: string;
        id: string;
        value: string;
        inputType: 'object' | 'string';
        optional?: boolean | undefined;
      }[]
    | undefined
  >;
  changeNodeData: (field: any, keyPath: KeyPath, value: any) => void;
  changeHandleData: (
    field: any,
    type: 'input' | 'output',
    index: number,
    value: any[],
  ) => void;
  selectWorkflow: () => Promise<string>;
  /** 插件注册的方法,用于插件自身使用 */
  pluginMethod: (method: string, args?: any[]) => Promise<any>;
}
