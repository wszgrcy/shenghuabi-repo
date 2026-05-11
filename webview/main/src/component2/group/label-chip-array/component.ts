import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  PiResolvedViewFieldConfig,
  PiyingViewGroupBase,
} from '@piying/view-angular';
import { NgTemplateOutlet } from '@angular/common';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ENTER, SPACE } from '@angular/cdk/keycodes';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { FieldArray, FieldGroup } from '@piying/view-angular-core';
@Component({
  selector: 'label-chip-array',
  templateUrl: './component.html',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    NgTemplateOutlet,
    MatChipsModule,
    MatFormFieldModule,
    MatInput,
    MatButtonModule,
    MatIconModule,
    PurePipe,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./component.scss'],
})
export class LabelChipFAC extends PiyingViewGroupBase {
  // defaultLength = input<number>();
  // initPrefix = input<(index: number | undefined) => any>();
  minLength = input<number>(0);
  displayKey = input.required<string>();
  placeholder = input<string>();
  findDisplayValue$$ = (field: PiResolvedViewFieldConfig) => {
    return (field.form.control as FieldGroup).find(this.displayKey())!.value$$;
  };
  readonly list = [ENTER, SPACE];
  activate$ = signal(0);

  ngOnInit(): void {
    // let length = (this.field$$().form.control!.value || []).length;
    // const addLength = Math.max(0, (this.defaultLength() || 0) - length);
    // for (let i = 0; i < addLength; i++) {
    //   this.field$$().action.set(this.initPrefix()?.(length + i));
    // }
  }

  add(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (!value) {
      return;
    }
    const index = this.children$$().length;
    const isRepeat = (this.field$$().form.control as FieldArray)
      .children$$()
      .map((item) => {
        return (item as FieldGroup).find(this.displayKey())!.value;
      })
      .some((controlValue) => controlValue === value);

    if (isRepeat) {
      return;
    }
    this.field$$().action.set({ [this.displayKey()]: value });
    this.switch(index);
    event.chipInput!.clear();
    this.field$$().form.control!.markAsTouched();
  }

  remove(index: number) {
    if (this.activate$() > this.children$$().length - 2) {
      this.activate$.update((a) => Math.max(0, a - 1));
    }
    this.field$$().action.remove(index);
    this.field$$().form.control!.markAsTouched();
  }
  switch(index: number) {
    this.activate$.set(index);
    this.field$$().form.control!.markAsTouched();
  }
}
