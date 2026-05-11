import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { FieldGroup } from '@piying/view-angular-core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'rest-chip-group',
  templateUrl: './component.html',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    NgTemplateOutlet,
    MatChipsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    PurePipe,
    MatSelectModule,
    FormsModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./component.scss'],
})
export class RestChipFGC extends PiyingViewGroupBase {
  optionalkeyList = input.required<string[]>();
  placeholder = input<string>();
  selected$ = signal(undefined);
  findDisplayValue$$ = (field: PiResolvedViewFieldConfig) => {
    return `${field.fullPath!.slice(-1)[0]}`;
  };

  activate$ = signal(0);
  resolvedKeyList$$ = computed(() => {
    const addedKeyList = Object.keys(
      (this.field$$().form.control as FieldGroup).resetControls$(),
    );
    if (!addedKeyList.length) {
      return this.optionalkeyList();
    }
    return this.optionalkeyList().filter((key) => {
      return addedKeyList.every((ak) => ak !== key);
    });
  });

  remove(field: PiResolvedViewFieldConfig) {
    if (this.activate$() > this.children$$().length - 2) {
      this.activate$.update((a) => Math.max(0, a - 1));
    }
    this.field$$().action.remove(field.fullPath.slice(-1)[0]);
  }
  switch(index: number) {
    this.activate$.set(index);
  }
  selectionChanged($event: any) {
    const index = this.children$$().length;
    this.field$$().action.set({}, $event);
    this.switch(index);
    this.selected$.set(undefined);
  }
}
