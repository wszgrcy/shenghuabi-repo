import { OverlayModule } from '@angular/cdk/overlay';
import und from '@angular/common/locales/und';
import {
  ChangeDetectionStrategy,
  Component,
  SimpleChanges,
  computed,
  forwardRef,
  input,
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
import { Editor } from '@shenghuabi/lexical-textarea';
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
  options = input<any[]>();
  placeholder = input<string>();
  minHeight = input<number>(40);
  readonly Editor = Editor;

  onChange = (value: any) => {
    this.valueAndTouchedChange(value);
  };
  props$$ = computed(() => {
    return {
      value: this.value$(),
      onChange: this.onChange,
      variables: this.options(),
      className: 'textarea',
      minHeight: this.minHeight(),
      placeholder: this.placeholder(),
    };
  });
}
