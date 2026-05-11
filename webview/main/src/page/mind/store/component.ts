import {
  Component,
  ElementRef,
  Injector,
  inject,
  model,
  signal,
  viewChildren,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CardEditorComponent } from '../custom-node/card-editor/card-editor.component';
import { CustomNode } from '../custom-node/type';
import { MatIconModule } from '@angular/material/icon';

import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { KeyValuePipe } from '@angular/common';
import { AiChatNode } from '../custom-node/ai-chat-node/component';
import { NodeConfigComponent } from '../drawer/component';
import { filter } from 'rxjs';
import { deepClone } from '../../../util/clone';
import { ImageNodeComponent } from '../custom-node/image/image.component';
import { defaultsDeep } from 'lodash-es';
import { DrawNodeComponent } from '../custom-node/draw-node/component';
import { BridgeService } from '../service';
@Component({
  selector: 'node-store',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    CardEditorComponent,
    MatIconModule,
    MatMenuModule,
    KeyValuePipe,
    AiChatNode,
    ImageNodeComponent,
    DrawNodeComponent,
  ],
  styleUrl: './component.scss',
})
export class StoreComponent {
  list = model.required<Partial<CustomNode>[]>();
  dragContainer = viewChildren<ElementRef<HTMLElement>>('dragContainer');
  dialog = inject(MatDialog);
  data = {
    card: '添加卡片',
    chat: '添加对话',
    image: '添加图片',
  };
  defaultAddType = signal('card');
  // todo 编辑器变更
  injector = inject(Injector);
  bridge = inject(BridgeService);
  dataChanged(value: Partial<CustomNode['data']>, index: number) {
    this.list.update((list) => {
      list![index] = {
        ...list![index],
        data: { ...list![index]?.data, ...value },
      } as any;
      return list!.slice();
    });
  }
  async append(type: string) {
    this.defaultAddType.set(type);
    const data = await this.bridge.getDefaultConfig(type);
    this.list.update((list) => {
      list!.push({ ...data, type: type } as any);
      return list;
    });
  }
  deleteItem(index: number) {
    this.list.update((list) => {
      list.splice(index, 1);
      return list.slice();
    });
  }

  changeConfig(index: number) {
    const item = this.list()[index];
    const ref = this.dialog.open(NodeConfigComponent, {
      data: {
        data: deepClone({
          id: item.id,
          type: item.type,
          data: {
            style: item.data?.style,
            editor:
              item.type === 'card' || item.type === 'chat'
                ? item.data?.['editor']
                : undefined,
          },
        }),
      },
      injector: this.injector,
    });
    ref
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((value) => {
        this.list.update((list) => {
          list[index] = defaultsDeep(value, list[index]);
          return list.slice();
        });
      });
  }
  activateIndex = signal(-1);
  dragstartChanged(event: DragEvent, image: HTMLElement, index: number) {
    event.dataTransfer!.effectAllowed = 'copyMove';
    event.dataTransfer?.setDragImage(image, 0, 0);
    event.dataTransfer!.setData('type', `store`);
    this.activateIndex.set(index);
  }
}
