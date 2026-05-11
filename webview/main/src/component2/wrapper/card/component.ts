import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  InsertFieldDirective,
  PI_VIEW_FIELD_TOKEN,
} from '@piying/view-angular';
type ActionItem = {
  label: string;
  color?: string;
  fn: () => void;
  disable?: () => boolean;
};

@Component({
  selector: 'card-wrapper',
  templateUrl: './component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component.scss',
  imports: [InsertFieldDirective],
})
export class CardWrapper {
  field$$ = inject(PI_VIEW_FIELD_TOKEN);
  props$$ = computed(() => {
    return this.field$$().props();
  });
  loadingMap = new Map<ActionItem, WritableSignal<boolean>>();
  async loadFn(item: ActionItem) {
    const loading$ =
      this.loadingMap.get(item) ??
      (() => {
        const loading = signal(false);
        this.loadingMap.set(item, loading);
        return loading;
      })();

    loading$.set(true);
    try {
      await item.fn();
    } catch (error) {
    } finally {
      loading$.set(false);
    }
  }
}
