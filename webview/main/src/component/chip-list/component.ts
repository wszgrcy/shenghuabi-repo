import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LlamaModelConfigDialogNFCC } from './dialog/component';
import { filter } from 'rxjs';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { TrpcService } from '@fe/trpc';
import { computed } from 'static-injector';
import { BaseControl } from '@piying/view-angular';

@Component({
  selector: 'cyia-llama-model-config',
  templateUrl: './component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LlamaModelConfigFCC),
      multi: true,
    },
  ],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LlamaModelConfigFCC extends BaseControl {
  #client = inject(TrpcService).client;

  dialog = inject(MatDialog);
  // options = model.required<Signal<Record<string, any>>>();
  optionsChange = output();

  newChange = output();
  llamaVersion$$ = computed(() => {
    return this.#client.environment.llamaSwap.getLlamaVersion.query(undefined);
  });
  async viewConfig(index?: number) {
    const llamaVersion = await this.llamaVersion$$();
    const ref = this.dialog.open(LlamaModelConfigDialogNFCC, {
      data: {
        config: typeof index === 'number' ? this.value$()[index] : undefined,
        llamaVersion,
      },
      // maxWidth: '80%',
      // width: '800px',
      minWidth: '800px',
    });
    ref
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((newItem) => {
        if (newItem.action === 'create') {
          this.newChange.emit(newItem.value);
          this.valueChange([...(this.value$() ?? []), newItem.value]);
        } else if (newItem.action === 'change') {
          const list = this.value$().slice();
          list[index!] = newItem.value;
          this.valueChange(list);
        }
      });
  }

  itemRemove(index: number) {
    const list = this.value$().slice();
    list.splice(index!, 1);
    this.valueChange(list);
  }
  copyStop($event: Event) {
    $event.stopPropagation();
  }
}
