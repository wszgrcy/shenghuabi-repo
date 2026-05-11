import { localize2 } from '../../../../nls.js';
import {
  MenuId,
  registerAction2,
  Action2,
} from '../../../../platform/actions/common/actions.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { Categories } from '../../../../platform/action/common/actionCommonCategories.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { IHostService } from '../../../services/host/browser/host.js';

registerAction2(
  class extends Action2 {
    constructor() {
      super({
        id: 'workbench.action.openWalkthrough',
        title: localize2('shenghuabi.env-config', '环境配置'),
        category: Categories.Help,
        f1: true,
        menu: {
          id: MenuId.MenubarHelpMenu,
          group: '1_welcome',
          order: 2,
        },
        metadata: {
          description: localize2(
            'minWelcomeDescription',
            'Opens a Walkthrough to help you get started in VS Code.',
          ),
        },
      });
    }

    public run(
      accessor: ServicesAccessor,
      walkthroughID: string | { category: string; step: string } | undefined,
      toSide: boolean | undefined,
    ) {
      const commandService = accessor.get(ICommandService);
      commandService.executeCommand(
        `shenghuabi.open-environment-configuration`,
      );
    }
  },
);
registerAction2(
  class extends Action2 {
    constructor() {
      super({
        id: 'workbench.action.shenghuabi.help',
        title: localize2('shenghuabi.help', '帮助'),
        category: Categories.Help,
        f1: true,
        menu: {
          id: MenuId.MenubarHelpMenu,
          group: '1_welcome',
          order: 1,
        },
      });
    }

    public run(
      accessor: ServicesAccessor,
      walkthroughID: string | { category: string; step: string } | undefined,
      toSide: boolean | undefined,
    ) {
      const commandService = accessor.get(ICommandService);
      commandService.executeCommand(`shenghuabi.help`);
    }
  },
);

registerAction2(
  class extends Action2 {
    constructor() {
      super({
        id: 'workbench.action.reloadSoftwave',
        title: localize2('shenghuabi.reloadSoftwave', '重启软件'),
        category: Categories.Developer,
        f1: true,
      });
    }

    public run(
      accessor: ServicesAccessor,
      walkthroughID: string | { category: string; step: string } | undefined,
      toSide: boolean | undefined,
    ) {
      const hostService = accessor.get(IHostService);
      hostService.restart();
    }
  },
);
