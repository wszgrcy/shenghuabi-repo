import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DeleteConfirmComponent } from './delete-confirm/component';

import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  #dialog = inject(MatDialog);
  open(options?: { title?: string; description?: string }) {
    const ref = this.#dialog.open(DeleteConfirmComponent, {
      data: { title: options?.title, description: options?.description },
    });
    return firstValueFrom(ref.afterClosed()) as Promise<{ submit: boolean }>;
  }
}
