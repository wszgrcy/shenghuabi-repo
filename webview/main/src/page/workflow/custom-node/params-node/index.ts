import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { ParamsNodeComponent } from './component';
import { DEFAULT_INPUT_KEY, DEFAULT_INPUT_LABEL } from '@bridge/share';

export const InputParamsNodeDefine: WebviewNodeConfig = {
  type: 'input-params',
  label: '外界输入',
  icon: { fontIcon: 'input' },
  disableHead: true,
  disableConnect: true,
  color: 'primary',
  component: ParamsNodeComponent,
  inputs: [
    [
      {
        value: DEFAULT_INPUT_KEY,
        label: DEFAULT_INPUT_LABEL,
        inputType: 'object',
        optional: false,
      },
    ],
  ],
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },

        title: '',
      },
      style: {},
    };
  },
};
