import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PurePipe } from '@cyia/ngx-common/pipe';
import {
  PiResolvedViewFieldConfig,
  PiyingViewGroupBase,
} from '@piying/view-angular';
import { fieldControlStatusClass } from '@piying/view-angular-core';
import { Observable } from 'rxjs';
type ActionItem = {
  label: string;
  color?: string;
  icon?: string;
  fn?: (item: PiResolvedViewFieldConfig, index: any) => void;
  disable?: (item: PiResolvedViewFieldConfig, index: any) => boolean;
  tooltip?: string;
  children$$?: (
    item: PiResolvedViewFieldConfig,
    index: any,
  ) => Promise<ActionItem[]>;
  type?: 'audio' | 'list';
  url$$?: (
    item: PiResolvedViewFieldConfig,
    index: any,
  ) => Promise<string | undefined> | Observable<string | undefined>;
};
@Component({
  selector: 'card-array',
  templateUrl: './component.html',
  imports: [
    MatCardModule,
    NgTemplateOutlet,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    AsyncPipe,
    PurePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFAC extends PiyingViewGroupBase {
  childrenWrapperClass$$ = computed(() => {
    return this.field$$().props()['childrenWrapperClass'] ?? 'grid gap-2';
  });
  defaultLength = input<number>();
  initPrefix = input<(index: number | undefined) => any>();
  minLength = input<number>();
  enableLineInsert = input(false);
  actions = input<ActionItem[]>([]);
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
  loading$ = signal(false);
  async loadFn(
    action: ActionItem,
    item: PiResolvedViewFieldConfig,
    index: number,
  ) {
    this.loading$.set(true);
    try {
      await action.fn!(item, index);
    } catch (error) {
    } finally {
      this.loading$.set(false);
    }
  }
  status$$ = computed(() => {
    return fieldControlStatusClass(this.field$$().form.control);
  });
}
