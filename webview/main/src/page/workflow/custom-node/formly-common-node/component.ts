import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { BridgeService } from '../../service';
import { PiyingView, PiViewConfig } from '@piying/view-angular';
import { FormWrappers } from '../../define/node-form';
import { asVirtualGroup, condition } from '@piying/view-angular';
import { Displayhandle } from '../../define/handle/display.handle';
import * as v from 'valibot';
import { CustomNode } from '../../type';
import { FormsModule } from '@angular/forms';
import { ValueFormatDirective } from '../../../../directive/value-format.directive';
import { HandleAddon$$ } from '../../../../domain/chat-node/define';
import { deepEqual } from 'fast-equals';
import { DefaultFormTypes } from '@fe/form/default-type-config';
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
  providers: [],
})
export class FormlyCommonNodeComponent {
  define = input<v.BaseSchema<any, any, any>>();
  props = input.required<CustomNode>();
  #service = inject(BridgeService);
  model$$ = computed(
    () => {
      return { data: this.props().data };
    },
    { equal: deepEqual },
  );
  schema$$ = computed(() => {
    const define = this.define();
    if (!define) {
      return;
    }
    return v.pipe(
      v.intersect([define, HandleAddon$$()]),
      condition({
        environments: ['display', 'default'],
        actions: [asVirtualGroup()],
      }),
    );
  });
  #bridge = inject(BridgeService);
  context = this.#bridge.context;
  options = {
    environments: ['display'],
    context: this.context,
    handle: Displayhandle as any,
    fieldGlobalConfig: FieldGlobalConfig,
  };
  valueChange(event: CustomNode) {
    // todo 没找到为什么会出现递归变更,因为发射的值确实是一样的
    if (!deepEqual(event.data, this.props().data)) {
      this.#service.patchDataOne(this.props().id, event.data);
    }
  }
}
