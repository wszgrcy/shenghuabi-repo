import {
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';

import { BridgeService } from '../../service';
import { useEffect, useState } from 'react';
import { DrawService } from './draw.service';
import { minBy } from 'lodash-es';
import { v4 } from 'uuid';
import {
  ExcalidrawImperativeAPI,
  ExcalidrawProps,
  ExportToSvgInput,
} from './type';
import { CustomNode } from '../../custom-node/type';
import { effectOnce } from '@fe/util/effect-once';
import { filter, map } from 'rxjs';
import Point from '@mapbox/point-geometry';
import { excalidraw$$ } from '../../../../lazy-package';
import { AsyncPipe } from '@angular/common';
@Component({
  selector: `draw-layer`,
  templateUrl: './component.html',
  standalone: true,
  imports: [MatButtonModule, ReactOutlet, AsyncPipe],
  providers: [DrawService],
  styleUrls: ['./component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DrawLayer {
  Excalidraw$ = computed(() => excalidraw$$().then((item) => item.Excalidraw));
  #bridge = inject(BridgeService);
  #service = inject(DrawService);
  #el = inject<ElementRef<HTMLElement>>(ElementRef);
  #injector = inject(Injector);
  hidden$ = signal(true);
  context = () => {
    const [excalidrawAPI, setExcalidrawAPI] = useState<
      ExcalidrawImperativeAPI | undefined
    >(undefined);
    useEffect(() => {
      this.#service.instance.set(excalidrawAPI);
    }, [excalidrawAPI]);
    return {
      props: {
        excalidrawAPI: (api) => setExcalidrawAPI(api),
        langCode: 'zh-CN',
        initialData: {
          appState: { viewBackgroundColor: 'transparent' },
        },
      } as ExcalidrawProps,
    };
  };
  #nodeData: undefined | CustomNode;
  constructor() {
    this.#bridge.drawNodeChange$$
      .pipe(
        filter((item) => item.type === 'change'),
        map((item) => item.value),
      )
      .subscribe((value) => {
        if (value) {
          this.#bridge.patchNode({ id: value.id, hidden: true });
        }
        this.hidden$.set(false);
        this.#nodeData = value;
        effectOnce(
          () => {
            const bridge = this.#bridge.instance()!;
            const instance = this.#service.instance()!;
            if (bridge && instance) {
              return [bridge, instance] as const;
            }
            return;
          },

          ([bridge, instance]) => {
            const init = {
              appState: {
                viewBackgroundColor: 'transparent',
              },
            };
            if (value) {
              const sceneData = value.data.value as ExportToSvgInput;
              const node = this.#bridge.getNode(value.id)!;
              const newOffset = this.#bridge
                .instance()!
                .flowToScreenPosition(node.position);
              // 默认的最小值,其他的都应该减这个
              const minPos = this.#getMinPosition(sceneData.elements);
              for (const item of sceneData.elements) {
                (item as any).x = item.x - minPos.x + newOffset.x;
                (item as any).y = item.y - minPos.y + newOffset.y;
              }
            }
            instance.resetScene();
            const data = { ...init, ...value?.data.value };
            if (data.files) {
              instance.addFiles(Object.values(data.files));
            }
            instance.updateScene({
              ...data,
              appState: init.appState,
            });
          },
          this.#injector,
        );
      });
  }
  close() {
    if (this.#nodeData) {
      this.#bridge.patchNode({ id: this.#nodeData.id, hidden: false });
    }

    this.hidden$.set(true);
  }
  async appendDrawNode() {
    const instance = this.#service.instance()!;
    // console.log({
    //   elements: instance.getSceneElements(),
    //   appState: instance.getAppState(),
    //   files: instance.getFiles(),
    // });
    const elements = instance.getSceneElements();
    const bridge = this.#bridge.instance()!;
    const zoom = bridge.getZoom();
    if (!elements.length) {
      if (this.#nodeData) {
        this.#bridge.deleteNode([this.#nodeData]);
      }
    } else {
      const minPos = this.#getMinPosition(elements);
      const position = bridge.screenToFlowPosition(minPos);
      const initConfig = await this.#bridge.getDefaultConfig('draw')!;
      const value = {
        elements,
        appState: {
          ...instance.getAppState(),
          exportScale: 1 / zoom,
          exportBackground: false,
        },
        files: instance.getFiles(),
      };
      if (!this.#nodeData) {
        bridge.addNodes({
          ...initConfig,
          position,
          type: 'draw',
          id: v4(),
          data: {
            ...initConfig.data,
            value: value,
          } as any,
        });
      } else {
        this.#bridge.patchNode({
          id: this.#nodeData.id,
          position,
          data: {
            ...this.#nodeData.data,
            value,
          } as any,
        });
      }
    }
    this.#bridge.drawNodeChange$.next({
      value: undefined,
      type: 'end',
      source: 'end',
    });
    if (elements.length && this.#nodeData) {
      this.#bridge.patchNode({ id: this.#nodeData.id, hidden: false });
    }
    this.hidden$.set(true);
  }
  #getMinPosition(elements: ExportToSvgInput['elements']) {
    const pointList = elements.flatMap((item) => {
      if (!item.angle) {
        return [{ x: item.x, y: item.y }];
      }
      const center = new Point(
        item.x + item.width / 2,
        item.y + item.height / 2,
      );
      return [
        [item.x, item.y] as const,
        [item.x, item.y + item.height] as const,
        [item.x + item.width, item.y] as const,
        [item.x + item.width, item.y + item.height] as const,
      ]
        .map(([x, y]) => new Point(x, y))
        .map((p) => {
          return p.rotateAround(item.angle, center);
        });
    });
    const x = minBy(pointList, (item) => item.x)!.x;
    const y =
      minBy(pointList, (item) => item.y)!.y +
      this.#el.nativeElement.getBoundingClientRect().y;
    return { x, y };
  }
}
