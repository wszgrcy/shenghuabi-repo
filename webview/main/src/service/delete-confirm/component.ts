import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  providers: [],
})
export class DeleteConfirmComponent {
  readonly #data = inject(MAT_DIALOG_DATA);
  title = this.#data.title ?? '删除';
  description = this.#data.description ?? '是否删除?';

  #ref = inject(MatDialogRef);

  loading$ = signal(false);
  save() {
    this.#ref.close({ submit: true });
  }
}
