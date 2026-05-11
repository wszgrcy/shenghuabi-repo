import {
  Component,
  effect,
  forwardRef,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CHAT_ITEM_TYPE } from '@bridge/share';
import { SpanInputFCC } from '@cyia/component/core';
import { TrpcService } from '@fe/trpc';
@Component({
  selector: `chat-common-input`,
  templateUrl: './component.html',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    SpanInputFCC,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChatCommonInput),
      multi: true,
    },
  ],
})
// 用户对话普通输入
export class ChatCommonInput implements ControlValueAccessor {
  #onChange?: (input: CHAT_ITEM_TYPE) => void;
  submitChange = output();
  input$ = signal('');
  imageList$ = signal<string[]>([]);
  #client = inject(TrpcService).client;
  constructor() {
    // todo 未来修改因为输入不应该监听
    effect(() => {
      const value = this.input$();
      const imageList = this.imageList$();
      if (this.#onChange) {
        if (!imageList.length) {
          this.#onChange([{ type: 'text', text: value }]);
        } else {
          this.#onChange([
            { type: 'text', text: value },
            ...imageList.map((item) => {
              return { type: 'image_url' as const, image_url: { url: item } };
            }),
          ]);
        }
      }
    });
  }

  pasteChange(e: ClipboardEvent) {
    const clipboardData = e.clipboardData!;
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.indexOf('image') !== -1) {
        const imgFile = item.getAsFile();
        if (imgFile) {
          imgFile.arrayBuffer().then(async (buffer) => {
            const value = await this.#client.assets.imageConvertBase64.query({
              data: buffer,
            });
            if (!value) {
              return;
            }
            this.imageList$.update((list) => {
              return [...list, value];
            });
          });
        }
      }
    }
  }
  writeValue(obj: CHAT_ITEM_TYPE): void {
    if (obj && Array.isArray(obj)) {
      for (const item of obj) {
        if (item.type === 'text') {
          this.input$.set(item.text);
        } else if (item.type === 'image_url') {
          this.imageList$.update((list) => [...list, item.image_url.url]);
        }
      }
    } else {
      this.input$.set('');
      this.imageList$.set([]);
    }
  }
  registerOnTouched(fn: any): void {}
  registerOnChange(fn: any): void {
    this.#onChange = fn;
  }
  addImage() {
    this.#client.assets.getImageBase64
      .query(undefined)
      .then((value: string | undefined) => {
        if (!value) {
          return;
        }
        this.imageList$.update((list) => {
          return [...list, value];
        });
      });
  }
  stopDefault(e: MouseEvent) {
    e.stopPropagation();
  }
  removeImage(index: number) {
    this.imageList$.update((list) => {
      list = [...list];
      list.splice(index, 1);
      return list.slice();
    });
  }
}
