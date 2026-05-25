import type { KeyPath } from '@piying/view-angular-core';

export interface ComponentContext {

  parseTemplate: (
    value: string,
    language?: 'js' | 'plaintext' ,
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

  selectWorkflow: () => Promise<string>;
  /** 插件注册的方法,用于插件自身使用 */
  pluginMethod: (method: string, args?: any[]) => Promise<any>;
}
