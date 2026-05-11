import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'cyia-button',
  templateUrl: './button.component.html',
  providers: [],
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonNFCC {
  type = input<
    'raised' | 'stroked' | 'flat' | 'icon' | 'fab' | 'mini-fab' | undefined
  >(undefined);
  buttonType = input('button');
  color = input('primary');
  label = input<string>();
  disabled = input<boolean>();
  fontSet = input<string>();
  icon = input<string>();
  clicked = input<() => void | Promise<void>>();
  type$$ = computed(() => {
    const type = this.type();
    if (!type && this.icon()) {
      return 'icon';
    }
    return type;
  });

  loading$ = signal(false);
  async onClicked() {
    this.loading$.set(true);
    try {
      await this.clicked()!();
    } catch (error) {
    } finally {
      this.loading$.set(false);
    }
  }
}
