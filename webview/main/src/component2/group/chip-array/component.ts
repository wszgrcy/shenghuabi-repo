import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { PI_VIEW_FIELD_TOKEN, PiyingViewGroupBase } from '@piying/view-angular';
import { NgTemplateOutlet } from '@angular/common';
@Component({
  selector: 'chip-array',
  templateUrl: './component.html',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    PurePipe,
    NgTemplateOutlet,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component.scss',
})
export class ChipFAC extends PiyingViewGroupBase {
  defaultLength = input<number>();
  initPrefix = input<(index: number | undefined) => any>();
  chipLabel = input.required<(index: number) => string>();
  minLength = input<number>(0);
  field = inject(PI_VIEW_FIELD_TOKEN);

  activate$ = signal(0);

  ngOnInit(): void {
    // todo 这里的默认添加应该改成变更时检查?,有时候初始化并不会传入?
    const length = (this.field().form.control!.value || []).length;
    const addLength = Math.max(0, (this.defaultLength() || 0) - length);
    for (let i = 0; i < addLength; i++) {
      this.field().action.set(this.initPrefix()?.(length + i));
    }
  }

  addNewChip() {
    const index = this.children$$().length;
    this.field().action.set(this.initPrefix()?.(index), index);
    this.switch(index);
  }
  remove(index: number) {
    if (this.activate$() > this.children$$().length - 2) {
      this.activate$.update((a) => Math.max(0, a - 1));
    }
    this.field().action.remove(index);
  }
  switch(index: number) {
    this.activate$.set(index);
  }
}
