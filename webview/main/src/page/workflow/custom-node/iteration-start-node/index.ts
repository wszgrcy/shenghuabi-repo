import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { IterationStartNodeComponent } from './component';

export const IterationStartNodeDefine: WebviewNodeConfig = {
  type: 'iteration-start',
  label: '迭代项',
  disableHead: true,
  disableConnect: true,
  component: IterationStartNodeComponent,
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },

        title: '',
      },
      draggable: false,
      style: {},
    };
  },
};
