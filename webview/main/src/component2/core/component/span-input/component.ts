import {
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  COMPOSITION_BUFFER_MODE,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'span-input',
  templateUrl: './component.html',
  styleUrls: ['./component.scss'],
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpanInputFCC),
      multi: true,
    },
  ],
})
export class SpanInputFCC implements ControlValueAccessor {
  /** ---输入--- */
  /** @title 占位符
  @default '' */
  placeholder = input<string>('');
  /** @title 回车提交
  @description 启用回车提交后,只能Shift+Enter换行 */
  enterSubmit = input<boolean>();
  /** ---输出--- */
  /** @title 提交变更
  @description 配合回车提交使用 */
  submitChange = output<void>();

  spanElRef = viewChild.required<ElementRef<HTMLSpanElement>>('span');
  #onChange?: (value: string) => void;

  value?: string;
  disabled = signal(false);
  composition$ = signal(false);
  #compositionMode =
    inject(COMPOSITION_BUFFER_MODE, { optional: true }) ?? true;

  constructor() {}

  writeValue(value: any): void {
    if (typeof value === 'string' && this.value !== value) {
      this.spanElRef().nativeElement.textContent = value;
      this.value = value;
    } else if (!value) {
      this.spanElRef().nativeElement.textContent = '';
      this.value = '';
    }
  }
  registerOnChange(fn: any): void {
    this.#onChange = fn;
  }
  registerOnTouched(fn: any): void {}

  valueChange() {
    if (this.disabled()) {
      return;
    }
    if (
      !this.#compositionMode ||
      (this.#compositionMode && !this.composition$())
    ) {
      this.#updateValue();
    }
  }
  #updateValue() {
    this.value = this.spanElRef().nativeElement.textContent!;
    this.#onChange!(this.value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  blockEnter(event: KeyboardEvent) {
    if (!this.enterSubmit()) {
      return;
    }
    if (!event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      this.submitChange.emit();
    }
  }
  _compositionStart() {
    this.composition$.set(true);
  }
  _compositionEnd(event: CompositionEvent) {
    this.composition$.set(false);
    this.#compositionMode && this.#updateValue();
  }
}
