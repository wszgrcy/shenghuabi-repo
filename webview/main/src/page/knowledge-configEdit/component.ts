import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TrpcService } from '@fe/trpc';

import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';

import { PiyingView, PiViewConfig } from '@piying/view-angular';

import { KnowledgeEditFormDefine, KnowledgeEditType } from '@bridge/share';
import { DefaultFormTypes, Wrappers } from '@fe/form/default-type-config';
const FieldGlobalConfig = {
  types: DefaultFormTypes,
  wrappers: {
    ...Wrappers,
  },
} as PiViewConfig;
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatRadioModule,
    PiyingView,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export default class KnowledgeCreate {
  loading$ = signal(false);
  // group = new FormGroup({});
  model = signal({} as KnowledgeEditType);
  extraPanelSet = new Set<string>();

  // 模型名 相关
  schema = KnowledgeEditFormDefine;
  options = {
    fieldGlobalConfig: FieldGlobalConfig,
  };
  #trpc = inject(TrpcService).client;
  activateCollection$$ = computed(() => {
    return this.model().activateCollection;
  });
  constructor() {}
  ngOnInit(): void {
    this.#trpc.knowledge.getKnowledgeConfig.query(undefined).then((value) => {
      this.model.set(value);
    });
  }

  submit() {
    this.#trpc.knowledge.updateKnowledgeVector
      .query(this.model())
      .then((value) => {
        this.model.set(value);
      });
  }
  deleteItem(item: any) {
    this.loading$.set(true);
    this.#trpc.knowledge.deletCollectionItem
      .query(item.collectionName)
      .then((value) => {
        this.model.set(value);
      })
      .finally(() => {
        this.loading$.set(false);
      });
  }
  collectionChange(item: MatRadioChange) {
    this.loading$.set(true);

    this.#trpc.knowledge.changeActiveCollection
      .query(item.value)
      .then((value) => {
        this.model.set(value);
      })
      .finally(() => {
        this.loading$.set(false);
      });
  }
}
