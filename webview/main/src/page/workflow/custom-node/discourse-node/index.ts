import { WebviewNodeConfig } from '@shenghuabi/workflow/share';

import { DISCOURSE_HELP_DEFINE } from '@share/valibot/define';

export const DiscourseNodeDefine: WebviewNodeConfig = {
  type: 'discourse-help',
  label: `帮助`,
  icon: { fontIcon: 'help' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [`- 从论坛上获取帮助`].join('\n'),
  // config: defineConfig,
  displayConfig: DISCOURSE_HELP_DEFINE,
  config: DISCOURSE_HELP_DEFINE,

  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },
      },
      width: 300,
    };
  },
};
