import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CustomNode } from '../type';
import { NodeBase } from '../node.base';

import { ExportToSvgInput } from '../../layer/draw/type';
import { excalidraw$$ } from '../../../../lazy-package';
import { DrawDataType, DrawMindNode } from '@bridge/share';
@Component({
  standalone: true,
  imports: [MatInputModule, MatFormFieldModule, FormsModule],
  templateUrl: './component.html',
  host: {},
  selector: `draw-node`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component.scss',
})
export class DrawNodeComponent extends NodeBase<DrawDataType> {
  parent = viewChild<ElementRef<HTMLElement>>('parent');
  // todo 实现的不优雅。因为需要处理两套更新
  dataChange = output<Partial<CustomNode['data']>>();
  inStore = input(false);
  anchor$ = viewChild<ElementRef<HTMLElement>>('anchor');
  constructor() {
    super();
    effect(() => {
      const value = this.value$() as ExportToSvgInput;
      const anchor = this.anchor$();
      if (value && anchor) {
        (async () => {
          anchor.nativeElement.innerHTML = '';
          anchor.nativeElement.appendChild(
            await (
              await excalidraw$$()
            ).exportToSvg({
              ...value,
              exportPadding: 0,
              skipInliningFonts: true,
            }),
          );
        })();
      }
    });
  }
  changeToEdit(event: MouseEvent) {
    event.stopPropagation();
    if (this.inStore()) {
      return;
    }
    this.bridge.drawNodeChange$.next({
      type: 'change',
      source: 'change',
      value: this.props() as DrawMindNode,
    });
    // 转到编辑应该先隐藏自身,然后给绘画层
  }
}
