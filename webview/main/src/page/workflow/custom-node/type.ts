import { Injector, Type } from '@angular/core';
import { CustomNode } from '../type';
import * as v from 'valibot';
import { WorkflowNodeConfigOutputType } from '@bridge/share';

export type InitDataFunction = () => Partial<CustomNode>;
export interface HandleNode {
  label: string;
  value: string;
}
export type InputHandleNode = HandleNode & {
  inputType?: string;
  optional?: boolean;
};
export type NodeComponentType = {
  /** 非工作流中,模板上下文中使用 */
  templateConfig?: v.BaseSchema<any, any, any>;
  /** 打开面板用的 */
  displayConfig?: v.BaseSchema<any, any, any>;
  config?: v.BaseSchema<any, any, any>;
  initData: InitDataFunction;
  component?: Type<any>;
  afterAdd?: (node: CustomNode, injector: Injector) => any;
  priority?: number;
} & WorkflowNodeConfigOutputType;
