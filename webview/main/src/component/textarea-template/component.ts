import { OverlayModule } from '@angular/cdk/overlay';
import und from '@angular/common/locales/und';
import {
  ChangeDetectionStrategy,
  Component,
  SimpleChanges,
  computed,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';
import { AttributesDirective, BaseControl } from '@piying/view-angular';
import {
  Editor,
  extractVariableItems,
  restoreEditorState,
  SimpleVariableNode,
  simplifyEditorState,
} from '@shenghuabi/lexical-textarea';
import { deepEqual } from 'fast-equals';
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
})
export class TextareaTemplateFCC extends BaseControl {
  // static __version = 2;
  // templateRef = viewChild.required('templateRef');
  override value$ = signal(undefined, { equal: deepEqual });
  #value2$$ = computed(() => {
    let value = this.value$();
    return value ? restoreEditorState(value) : undefined;
  });
  options = input<any[]>();
  placeholder = input<string>();
  minHeight = input<number>(40);
  variableChange = output<{
    all: SimpleVariableNode['item'][];
    default: SimpleVariableNode['item'][];
    custom: SimpleVariableNode['item'][];
  }>();
  readonly Editor = Editor;

  onChange = (value: any) => {
    let list = simplifyEditorState(value);
    this.variableChange.emit(extractVariableItems(list));
    this.valueAndTouchedChange(list);
  };
  props$$ = computed(() => {
    return {
      value: this.#value2$$(),
      onChange: this.onChange,
      variables: this.options(),
      className: 'textarea',
      minHeight: this.minHeight(),
      placeholder: this.placeholder(),
    };
  });
}
