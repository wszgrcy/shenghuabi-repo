import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { NodeBase } from '../node.base';
import { inject } from '@angular/core';
import { TrpcService } from '@fe/trpc';
import { v4 } from 'uuid';
import { DrawDataType, ImageDataType } from '@bridge/share';
import { getImgSrc } from '../../util/img-src';

@Component({
  selector: 'image-node',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './image.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageNodeComponent extends NodeBase<DrawDataType> {
  #client = inject(TrpcService).client;
  inStore = input(false);
  dataChange = output<Partial<ImageDataType>>();
  url = signal<string | undefined>(undefined);
  /**
   * 写入直接写路径,读取读路径,然后就是输入时如果有转换就先转换再读路径
   */
  constructor() {
    super();
    effect(() => {
      const value = this.value$() as ImageDataType['value'];
      if (!value || !value.src) {
        return;
      }

      this.url.set(getImgSrc(value.src));
    });
  }

  async selectImage(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    input.value = '';
    const data = {
      value: {
        kind: 'image' as const,
        type: file.type,
        src: `${v4()}-${file.name}`,
      } as NonNullable<ImageDataType['value']>,
    };
    await this.#client.mind.saveImage.query({
      name: data.value.src!,
      buffer: new Uint8Array(await file.arrayBuffer()),
    });
    this.#saveData(data);
  }
  #saveData(data: { value: ImageDataType['value'] }) {
    if (this.inStore()) {
      this.dataChange.emit(data);
    } else {
      this.bridge.patchDataOne(this.props().id, data);
    }
  }
}

// todo src未修改
