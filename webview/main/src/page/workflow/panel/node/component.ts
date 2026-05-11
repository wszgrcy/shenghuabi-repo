import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  WritableSignal,
  computed,
  inject,
  input,
} from '@angular/core';

import { BridgeService } from '../../service';
import { CustomNode } from '../../type';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormGroup } from '@angular/forms';
import { NodeHeadComponent } from '../../custom-node/node-head/component';
import { MatButtonModule } from '@angular/material/button';
import { deepEqual } from 'fast-equals';
import { PiyingView, PiViewConfig } from '@piying/view-angular';
import { asVirtualGroup, condition } from '@piying/view-angular';

import { TrpcService } from '@fe/trpc';
import { HandleDataDefine } from '@share/valibot/define';
import * as v from 'valibot';
import { FormWrappers } from '../../define/node-form';
import { DefaultFormTypes } from '@fe/form/default-type-config';
const HandleAddon$$ = computed(() => {
  return v.object({
    data: v.object({
      handle: HandleDataDefine,
    }),
  });
});
const FieldGlobalConfig = {
  types: DefaultFormTypes,
  wrappers: FormWrappers,
} as PiViewConfig;
@Component({
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    NodeHeadComponent,
    MatButtonModule,
    PiyingView,
  ],
  templateUrl: './component.html',
  styleUrl: './component.scss',
  selector: `node-panel`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class NodePanelComponent {
  props = input.required<CustomNode>();
  close$ = input.required<WritableSignal<boolean>>();
  configForm = new FormGroup({});
  #service = inject(BridgeService);
  #injector = inject(Injector);
  #client = inject(TrpcService).client;
  // formly = viewChild<PiyingView>('formly');
  #type$$ = computed(() => {
    return this.props().type;
  });
  schema$$ = computed(
    () => {
      const { config } = this.#service.fullNodeObject$$()[this.#type$$()!];
      if (config) {
        // setTimeout(() => {
        //   console.log(this.formly()?.resolvedFields$$());
        // }, 800);
        return v.pipe(
          v.intersect([config, HandleAddon$$()]),
          condition({
            environments: ['config', 'default'],
            actions: [asVirtualGroup()],
          }),
        );
      }
      return undefined;
    },
    { equal: deepEqual },
  );
  #bridge = inject(BridgeService);
  context = this.#bridge.context;
  options = {
    context: this.context,
    environments: ['config', 'default'],
    fieldGlobalConfig: FieldGlobalConfig,
  };
  modelChanged(data: CustomNode) {
    // console.log('数据', data);
    this.#service.patchDataOne(this.props().id, data.data);
  }
  closeSelf() {
    this.close$().set(false);
  }
}
