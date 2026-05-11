import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PiyingViewGroupBase } from '@piying/view-angular';
import { NgTemplateOutlet } from '@angular/common';
@Component({
  selector: 'rw-array',
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, NgTemplateOutlet],
  standalone: true,
  styleUrls: ['./component.scss'],
})
export class RwFAC extends PiyingViewGroupBase {
  defaultLength = input<number>();
  initPrefix = input<(index: number | undefined) => any>();
  minLength = input<number>();
  enableLineInsert = input(false);
  ngOnInit(): void {
    const length = (this.field$$().form.control!.value || []).length;

    const addLength = Math.max(0, (this.defaultLength() || 0) - length);
    for (let i = 0; i < addLength; i++) {
      this.field$$().action.set(this.initPrefix()?.(length + i));
    }
  }
  remove(index: number) {
    this.field$$().action.remove(index);
  }
  add() {
    this.field$$().action.set(this.initPrefix()?.(undefined));
  }
  insert(index: number) {
    const value = (this.field$$().form.control!.value$$() as any[]).slice();
    value.splice(index, 0, this.initPrefix()?.(index));
    this.field$$().form.control!.updateValue(value);
  }
}
