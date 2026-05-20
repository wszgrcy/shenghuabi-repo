import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { ParamsNodeComponent } from './component';
import { WebviewNodeMap } from '@shenghuabi/workflow/webview';
export const InputParamsNodeDefine: WebviewNodeConfig = {
  ...WebviewNodeMap.InputParamsWebviewConfig,

  component: ParamsNodeComponent,
};
