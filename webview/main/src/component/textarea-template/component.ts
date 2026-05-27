import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';
import { BaseControl } from '@piying/view-angular';
import {
  Editor,
  extractVariableItems,
  restoreEditorState,
  SimpleVariableNode,
  simplifyEditorState,
  VariableEntry,
} from '@shenghuabi/lexical-textarea';
import { deepEqual } from 'fast-equals';
import { NodeService } from '../../page/workflow/custom-node/formly-common-node/node.service';
import { BridgeToken } from '../../page/workflow/type';
import { flatFilterHandleList } from '@shenghuabi/workflow/share';
@Component({
  selector: 'cyia-textarea-template',
  templateUrl: 'component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaTemplateFCC),
      multi: true,
    },
  ],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    OverlayModule,
    MatIconModule,
    ReactOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component.scss',
})
export class TextareaTemplateFCC extends BaseControl {
  // static __version = 2;
  // templateRef = viewChild.required('templateRef');
  override value$ = signal(undefined, { equal: deepEqual });
  #value2$$ = computed(() => {
    const value = this.value$();
    return value ? restoreEditorState(value) : undefined;
  });
  // options = input<any[]>();
  placeholder = input<string>();
  minHeight = input<number>(40);
  variableChange = output<{
    all: SimpleVariableNode['item'][];
    default: SimpleVariableNode['item'][];
    custom: SimpleVariableNode['item'][];
  }>();
  #injector = inject(Injector);
  #bridge = inject(BridgeToken, { optional: true });
  #nodeService = inject(NodeService, { optional: true });
  readonly #id$$ = computed(() => this.#nodeService?.props$().id);
  #linkedEdge$$ = computed(() => {
    const id = this.#id$$();
    if (!id) {
      return undefined;
    }
    return this.#bridge?.edgeTargetList$$()[id];
  });
  readonly Editor = Editor;
  variableList$$ = computed(() => {
    const ctxList: VariableEntry[] = [];
    for (const edge of this.#linkedEdge$$() ?? []) {
      const node = this.#bridge?.nodesObj$()[edge.source];
      const list = flatFilterHandleList(node?.data.handle?.output);
      const sourceHandle = list.find((item) => item.id === edge.sourceHandle);
      if (!sourceHandle || sourceHandle?.type === 'connect') {
        continue;
      }
      const data = node!.data!;
      ctxList.push({
        label: `${data.title}-${sourceHandle.label}`,
        value: [node!.id, sourceHandle.name!],
      });
    }
    return ctxList;
  });

  onChange = (value: any) => {
    const list = simplifyEditorState(value);
    this.variableChange.emit(extractVariableItems(list));
    this.valueAndTouchedChange(list);
  };
  override writeValue(obj: any) {
    super.writeValue(obj);
    if (Array.isArray(obj) && obj.length) {
      this.variableChange.emit(extractVariableItems(obj));
    }
  }
  props$$ = computed(() => {
    return {
      value: this.#value2$$(),
      onChange: this.onChange,
      variables: this.variableList$$(),
      className: 'textarea',
      minHeight: this.minHeight(),
      placeholder: this.placeholder(),
    };
  });
}
