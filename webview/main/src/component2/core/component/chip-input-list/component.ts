import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import { BaseControl } from '@piying/view-angular';
const EMPTY_LIST = Promise.resolve([]);
@Component({
  selector: 'chip-input-list',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    AsyncPipe,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipInputListFCC),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipInputListFCC extends BaseControl {
  /** ---输入--- */
  /** @title 禁止输入 */
  disableInput = input<boolean>();
  /** @title 禁止删除 */
  disableDelete = input<boolean>();
  /** @title 可编辑
  @description 已经实现的内容可编辑 */
  editable = input<boolean>();
  /** @title 自动补全 */
  autocompletion = input<boolean>();
  /** @title 失去焦点添加 */
  addOnBlur = input<boolean>();
  /** @title 输入行 */
  inputRow = input<boolean>();
  /** @title 占位符 */
  placeholder = input<string>();
  /** @title 占位符 */
  getCompletionList =
    input<(str: string, injector: Injector) => Promise<any>>();
  /** ---输出--- */

  // 好像没有使用
  // format = input<boolean>();

  readonly list = [ENTER, SPACE];
  #injector = inject(Injector);
  searchContent$ = signal('');

  constructor() {
    super();
    let time: any;
    effect(() => {
      clearTimeout(time);
      const content = this.searchContent$();
      time = setTimeout(() => {
        this.#debouceSearchContent$.set(content);
      }, 800);
    });
  }

  prefixRemoveChange(i: number) {
    const list = ((this.value$() as string[]) || []).slice();
    list.splice(i, 1);
    this.valueAndTouchedChange(list);
  }
  prefixChange(event: MatChipInputEvent) {
    if (!event.value.trim()) {
      return;
    }
    const list = ((this.value$() as string[]) || []).slice();
    if (list.includes(event.value)) {
      return;
    }

    list.push(event.value);
    this.valueAndTouchedChange(list);
  }
  changeItem(index: number, event: { value: string }) {
    if (!event.value) {
      return;
    }
    const list = ((this.value$() as string[]) || []).slice();
    list[index] = event.value.trim();
    this.valueAndTouchedChange(list);
  }
  #debouceSearchContent$ = signal('');
  completionList$$ = computed(() => {
    const content = this.#debouceSearchContent$().trim();
    return content
      ? (this.getCompletionList()!(content, this.#injector) as Promise<
          {
            label: string;
            value: string;
          }[]
        >)
      : Promise.resolve(EMPTY_LIST);
  });
  async completionChange(event: MatChipInputEvent) {
    const value = event.value.trim();
    const completionList = (await this.completionList$$()) as {
      label: string;
      value: string;
    }[];
    const isExist = completionList.some((item) => item.value === value);
    if (!isExist) {
      return;
    }
    const list = ((this.value$() as string[]) || []).slice();
    if (list.includes(event.value)) {
      return;
    }

    list.push(event.value);
    this.valueAndTouchedChange(list);
  }
}
