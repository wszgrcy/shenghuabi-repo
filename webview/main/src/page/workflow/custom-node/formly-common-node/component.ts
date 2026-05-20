import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { BridgeService } from '../../service';
import { PiyingView, PiViewConfig, actions } from '@piying/view-angular';
import { FormWrappers } from '../../define/node-form';
import { asVirtualGroup } from '@piying/view-angular';
import { Displayhandle } from '../../define/handle/display.handle';
import * as v from 'valibot';
import { CustomNode } from '../../type';
import { FormsModule } from '@angular/forms';
import { ValueFormatDirective } from '../../../../directive/value-format.directive';
import { deepEqual } from 'fast-equals';
import { DefaultFormTypes } from '@fe/form/default-type-config';
import { HandleWC } from '../../wrapper/handle/component';
import { NodeService } from './node.service';
const FieldGlobalConfig = {
  types: DefaultFormTypes,
  wrappers: FormWrappers,
} as PiViewConfig;
@Component({
  selector: 'formly-common-node',
  templateUrl: './component.html',
  styleUrl: './component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PiyingView, FormsModule, ValueFormatDirective],
  providers: [NodeService],
})
export class FormlyCommonNodeComponent {
  define = input<v.BaseSchema<any, any, any>>();
  props = input.required<CustomNode>();
  #service = inject(BridgeService);
  model$$ = computed(
    () => {
      return this.props().data.config?.value;
    },
    { equal: deepEqual },
  );
  schema$$ = computed(() => {
    const define = this.define();
    if (!define) {
      return;
    }
    return define;
  });
  nodeService = inject(NodeService);
  children = computed(() => {
    return this.nodeService.nodeList$();
  });
  #bridge = inject(BridgeService);
  context = this.#bridge.context;
  options = {
    context: {
      ...this.context,
      setOutputHandle: (index: number, list: any[]) => {
        let data = this.props().data;
        data.handle ??= { output: [] };
        data.handle.output ??= [];
        data.handle!.output[index] ??= [];
        data.handle!.output[index] ??= list;
        this.#bridge.patchDataOne(this.props().id, data);
      },
    },
    fieldGlobalConfig: FieldGlobalConfig,
  };
  valueChange(event: CustomNode['data']['config']) {
    // todo 没找到为什么会出现递归变更,因为发射的值确实是一样的
    // todo 重构 目前仅赋值有效,还有无效部分
    if (!deepEqual(event, this.props().data.config?.value)) {
      this.#service.patchDataOne(this.props().id, { config: { value: event } });
    }
  }
  constructor() {
    this.nodeService.props$ = this.props;
  }
}
