import type { z } from 'zod';
import type zodToJsonSchema from 'zod-to-json-schema';

export type InputParams = Record<string, { value: any; extra?: any }>;
/** 通用工具 */
export interface Util {
  /** 文件系统 */
  fs: typeof import('fs');
  /** 文件路径 */
  path: typeof import('path');
  /** 文档 https://zod.dev/ */
  zod: typeof z;
  /** 文档 https://github.com/StefanTerdell/zod-to-json-schema
   * 简单使用方法直接调用`zodToJsonSchema(define)`
   */
  zodToJsonSchema: typeof zodToJsonSchema;
  yaml: typeof import('yaml');
}
/** require('xxx') */
export type NodeJsRequire = NodeRequire;
/** 节点返回类型 */
export type NodeReturn = (
  /** 根据不同的出口返回不同格式的数据 */ outputName: string,
) => Promise<{
  /** 出口数据 */
  value: any;
  /** 一般用于标识元数据,表示对话中使用了哪些引用 */
  extra?: {
    metadata?: { type: string; description: string; tooltip?: string };
  };
}>;
/** 对话使用的 JsonSchema 类型
 * 简单使用{name:'xxx',schema:z.object({})}
 */
export type ChatJsonSchema = {
  /**
   * The name of the response format. Must be a-z, A-Z, 0-9, or contain underscores
   * and dashes, with a maximum length of 64.
   */
  name: string;

  /**
   * A description of what the response format is for, used by the model to determine
   * how to respond in the format.
   */
  description?: string;

  /**
   * The schema for the response format, described as a JSON Schema object.
   */
  schema?: Record<string, unknown>;

  /**
   * Whether to enable strict schema adherence when generating the output. If set to
   * true, the model will always follow the exact schema defined in the `schema`
   * field. Only a subset of JSON Schema is supported when `strict` is `true`. To
   * learn more, read the
   * [Structured Outputs guide](https://platform.openai.com/docs/guides/structured-outputs).
   */
  strict?: boolean | null;
};
