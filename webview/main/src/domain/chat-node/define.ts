import { computed } from '@angular/core';
import { condition } from '@piying/view-angular';
import { renderConfig } from '@piying/view-angular-core';
import { HandleDataDefine } from '@share/valibot/define';
import * as v from 'valibot';
export const HandleAddon$$ = computed(() => {
  return v.pipe(
    v.object({
      data: v.object({
        handle: HandleDataDefine,
      }),
    }),
    condition({
      environments: ['display', 'default'],
      actions: [renderConfig({ hidden: true })],
    }),
  );
});
