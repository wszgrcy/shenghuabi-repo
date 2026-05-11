import { Component, forwardRef, inject, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';

@Component({
  selector: 'image-base64-input',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    FormsModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageBase64InputComponent),
      multi: true,
    },
  ],
})
export class ImageBase64InputComponent implements ControlValueAccessor {
  #client = inject(TrpcService).client;
  value$ = signal<{ type: 'image_url'; data: string }[]>([]);
  // 添加新的
  selectFile() {
    this.#client.assets.getImageBase64.query(undefined).then((item) => {
      if (item) {
        this.value$.update((list) => {
          list.push({ type: 'image_url', data: item });
          return list.slice();
        });
        this.valueChange();
      }
    });
  }

  remove(index: number) {
    this.value$.update((list) => {
      list.splice(index, 1);
      return list;
    });
    this.valueChange();
  }

  onChange = (_: any) => {};

  onTouched = () => {};

  writeValue(obj: any): void {
    if (obj) {
      this.value$.set(obj.slice());
    }
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  registerOnChange(fn: (_: any) => any): void {
    this.onChange = fn;
  }
  valueChange() {
    this.onChange(this.value$().slice());
  }
}
