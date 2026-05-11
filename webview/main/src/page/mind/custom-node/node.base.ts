import { input, Directive, computed, inject } from '@angular/core';
import { deepEqual } from 'fast-equals';
import { BridgeService } from '../service';
import { NodeCommonType, STYLE_Transformer } from '@bridge/share';
import { Node } from '@xyflow/react';
import { filter } from 'rxjs';
import { defaultsDeep } from 'lodash-es';
import * as v from 'valibot';
const EMPTY_OBJ = {};

@Directive()
export class NodeBase<DATA_TYPE extends NodeCommonType> {
  props = input.required<Node<DATA_TYPE>>();
  bridge = inject(BridgeService);
  protected event$$ = this.bridge.nodeEvent$.pipe(
    filter((item) => {
      return this.props().id === item.id;
    }),
  );
  id$ = computed(() => {
    return this.props().id;
  });
  data$ = computed(
    () => {
      return this.props().data;
    },
    { equal: deepEqual },
  );
  /** 有的自然会使用,没有的自然无法用 */
  value$ = computed(
    () => {
      return (this.data$() as any)?.value;
    },
    { equal: deepEqual },
  );
  // 暂时恢复用于防止边框宽度影响默认的尺寸
  #style = computed(
    () => {
      return this.data$().style;
    },
    { equal: deepEqual },
  );
  /** 动态样式的类 */
  styleClass$ = computed(
    () => {
      return defaultsDeep(
        v.parse(STYLE_Transformer, this.#style()),
        this.bridge.globalStyle$(),
      );
    },
    {
      equal: deepEqual,
    },
  );
}
