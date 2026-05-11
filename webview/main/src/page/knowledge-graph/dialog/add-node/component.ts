import clsx from 'clsx';
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
import PageComponent from '../../component';
import { TrpcService } from '@fe/trpc';
import { PiyingView } from '@piying/view-angular';
import { actions } from '@piying/view-angular-core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as v from 'valibot';
import { asVirtualGroup } from '@piying/view-angular';

import { ColClass, KnowledgeGraphCreateDefine } from '@bridge/share';
import { FieldGlobalConfig } from '@fe/form/default-type-config';

@Component({
  templateUrl: './component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PiyingView, MatButtonModule, MatDialogModule, MatIconModule],
  providers: [],
})
export class NodeNewComponent {
  readonly #data = inject(MAT_DIALOG_DATA);
  readonly parent: PageComponent = this.#data.parent;
  #formData = this.#data.formData;
  #client = inject(TrpcService).client;
  model = signal<v.InferInput<typeof KnowledgeGraphCreateDefine>>({
    fileName: this.#formData.fileName,
  } as any);
  #ref = inject(MatDialogRef);
  context = {
    getEntityTypeList: () => {
      return this.#client.knowledge.graph.getEntityTypeList
        .query({
          graphName: window.__pageConfig.data.graphName!,
        })
        .then((list) => list.map((item) => ({ label: item, value: item })));
    },
    getChunkContentList: (fileName: string) => {
      return this.#client.knowledge.graph.getChunkContentList
        .query({
          graphName: window.__pageConfig.data.graphName!,
          fileName: fileName,
        })
        .then((list) => {
          return list.map((item) => {
            return {
              label: item.payload.chunk,
              value: item.id,
            };
          });
        });
    },
    getFileNameList: () => {
      return this.#client.knowledge.graph.getFileNameList
        .query({
          graphName: window.__pageConfig.data.graphName!,
        })
        .then((list) => {
          return list.map((item) => ({
            label: item.id,
            value: item.id,
          }));
        });
    },
    nodeList: this.parent
      .graphNodeList$$()
      .map((item) => ({ label: item, value: item })),
    nodeInit: { type: this.#formData.type, name: this.#formData.name },
    edgeInit: { source: this.#formData.name, target: this.#formData.name },
  };
  options = {
    context: this.context,
    fieldGlobalConfig: FieldGlobalConfig,
  };
  schema = v.pipe(
    KnowledgeGraphCreateDefine,
    asVirtualGroup(),
    actions.wrappers.patch([
      { type: 'div', attributes: { class: clsx(ColClass) } },
    ]),
  );

  // formGroup = new FormGroup({});

  constructor() {}
  loading$ = signal(false);
  save() {
    this.loading$.set(true);
    this.#client.knowledge.graph.addNewNode
      .query({
        graphName: window.__pageConfig.data.graphName!,
        options: {
          nodes: this.model().nodeList?.map((item) => ({
            ...item,
            chunkId: this.model().chunkId,
            fileName: this.model().fileName,
          })),
          edges: this.model().edgeList?.map((item) => ({
            ...item,
            chunkId: this.model().chunkId,
            fileName: this.model().fileName,
          })),
        },
      })
      .then(() => {
        this.#ref.close(true);
      })
      .finally(() => {
        this.loading$.set(false);
      });
  }
}
// 两个地方,加默认值
