import { Component, computed, inject, Injector, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import type { ImageNode, ImagePayload } from './ImageNode';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CardEditorService } from '../../card-editor.service';
import { $getNodeByKey } from 'lexical';
import { firstValueFrom } from 'rxjs';
import { deepEqual } from 'fast-equals';
import { IMAGE_FORM_CONFIG } from './config';
import { ImageApiToken } from './token';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, MatButtonModule, MatTooltipModule, MatIconModule],
  styleUrl: './component.scss',
})
export class CardImageComponent {
  props = input.required<{ payload: ImagePayload; id: string }>();
  payload$ = computed(
    () => {
      return this.props().payload;
    },
    { equal: deepEqual },
  );
  dialog = inject(MatDialog);
  #service = inject(CardEditorService);
  #editor = this.#service.editor()!;
  #src$ = computed(() => {
    return this.props().payload.src;
  });
  #api = inject(ImageApiToken);
  #injector = inject(Injector);
  url$ = computed(() => {
    return this.#api.convertSrc(this.#src$());
  });

  async changeSetting() {
    const editorState = this.#editor.getEditorState();
    const node = editorState.read(
      () => $getNodeByKey(this.props().id) as ImageNode,
    );
    const options = node.getOptions();
    const ref = await this.#service
      .util()!
      .openDialog(IMAGE_FORM_CONFIG, options, {}, '编辑图片', this.#injector);

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) {
      return;
    }
    this.#editor.update(() => {
      return node.update(result);
    });
  }
  /**
   * 百分比
   * 宽度/百分比切换
   */
}
