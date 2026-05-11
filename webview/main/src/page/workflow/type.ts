import { HandleNode } from '@bridge/share';
import { Node } from '@xyflow/react';

export type CustomNode<T extends Record<string, any> = Record<string, any>> =
  Node<
    {
      value?: any;
      style?: Record<string, any>;
      handle?: {
        /** 0 必须是连接点，否则空掉，1必须是value,否则空掉，之后随意 */
        input: HandleNode[][];
        output: HandleNode[][];
      };

      minSize?: {
        height: number;
        width: number;
      };
      transform?: {
        resizable?: boolean;
      };
      title?: string;
      config?: Record<string, any>;
      /** 默认输出 */
      outputName?: string;
      /** 在工作流中禁止使用 */
      excludeUsage?: boolean;
      /** 用于前端部分 */
      options?: {
        /** 禁止自动打开配置 */
        disableOpenConfig?: boolean;
      };
    } & T
  >;
