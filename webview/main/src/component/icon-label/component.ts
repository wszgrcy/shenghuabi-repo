import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  PI_VIEW_FIELD_TOKEN,
  PiResolvedViewFieldConfig,
} from '@piying/view-angular';

@Component({
  selector: 'icon-label',
  templateUrl: './component.html',
  providers: [],
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconLabelNFCC {
  clicked = input<(field?: PiResolvedViewFieldConfig | null) => void>();
  options = input.required<
    Record<
      string,
      {
        label: string;
        icon: { fontIcon: string; fontSet?: string };
        color?: string;
      }
    >
  >();
  defaultStatus = input.required<string>();
  status = input<string>();

  loading$ = signal(false);
  #field = inject(PI_VIEW_FIELD_TOKEN, { optional: true });
  async onClicked() {
    this.loading$.set(true);
    try {
      await this.clicked()!(this.#field?.());
    } catch (error) {
    } finally {
      this.loading$.set(false);
    }
  }
}
