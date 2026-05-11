import {
  ActionDefaultDefine,
  MindConfigDefine,
  STYLE_LAYOUT_DEFINE,
} from '@bridge/share';
import * as v from 'valibot';
/** 通用样式定义
 * 这个也是脑图中默认的样式
 */
export const STYLE_DEFAULT_LAYOUT_DEFINE = v.optional(
  STYLE_LAYOUT_DEFINE,
  () => ({
    main: {
      border: {
        enable: true,
        value: {
          left: { radius: 8, width: 1 },
          right: { radius: 8, width: 1 },
          top: { radius: 8, width: 1 },
          bottom: { radius: 8, width: 1 },
        },
      },
      background: {
        enable: true,
        value: {
          backgroundColor: getComputedStyle(document.body).getPropertyValue(
            '--vscode-editorWidget-background',
          ),
        },
      },
      font: {
        enable: true,
        value: {
          color: getComputedStyle(document.body).getPropertyValue(
            '--vscode-foreground',
          ),
          fontSize:
            +getComputedStyle(document.body)
              .getPropertyValue('--vscode-editor-font-size')
              .slice(0, -2) || 18,
        },
      },
    },
  }),
);

export const WebViewGlobalConfigDefine = v.object({
  ...ActionDefaultDefine.entries,
  data: v.object({
    ...ActionDefaultDefine.entries.data.entries,
    style: STYLE_DEFAULT_LAYOUT_DEFINE,
  }),
});
export const WebviewMindConfigDefine = v.object({
  ...MindConfigDefine.entries,
  globalConfig: WebViewGlobalConfigDefine,
});
export interface NodeFormStatus {
  inStore: boolean;
  isGlobal: boolean;
  enableLayoutButton: boolean;
  enableEditorConfig: boolean;
}
