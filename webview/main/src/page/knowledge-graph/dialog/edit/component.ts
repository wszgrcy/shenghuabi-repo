import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import PageComponent from '../../component';
import { MatButtonModule } from '@angular/material/button';
import { NodeMergeComponent } from '../merge/component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getNodeData } from './get-node-data';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { getNodeType, NodeAttr } from '@bridge/share';
import { MatFormFieldModule } from '@angular/material/form-field';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatSelectModule } from '@angular/material/select';
import { TrpcService } from '@fe/trpc';
import { NodeNewComponent } from '../add-node/component';
import {
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { ZhPaginatorIntl } from '@fe/component/page/page.service';
import { SpanInputFCC } from '@cyia/component/core';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmService } from '../../../../service/confirm.service';
import { SelectorlessOutlet } from '@cyia/ngx-common/directive';
import * as v from 'valibot';
import { FieldGlobalConfig, safeDefine } from '@fe/piying/define';
import { actions, asControl, PiyingView } from '@piying/view-angular';
import {
  formConfig,
  hideWhen,
  setAlias,
  setComponent,
} from '@piying/view-angular-core';
import { switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { LinkWrapperComponent } from './wrapper/link/component';
import { ReadonlyWrapperComponent } from './wrapper/readonly/component';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatDialogModule,
    MatChipsModule,
    MatSlideToggleModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SpanInputFCC,
    PurePipe,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatMenuModule,
    SelectorlessOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../markdown/component.scss'],
  providers: [{ provide: MatPaginatorIntl, useClass: ZhPaginatorIntl }],
})
export class NodeEditComponent {
  tableLayout = v.object({
    edge: v.pipe(
      v.array(
        v.pipe(
          v.looseObject({
            source: v.pipe(
              v.string(),
              safeDefine.setComponent('autocomplete2', (actions) => {
                return [
                  actions.props.patch({ allowCustom: true }),
                  actions.props.patchAsync({
                    options: (field) => {
                      return this.nodeList$$();
                    },
                  }),
                ];
              }),
              v.title('来源'),
              actions.wrappers.set(['td', { type: LinkWrapperComponent }]),
            ),
            target: v.pipe(
              v.string(),
              safeDefine.setComponent('autocomplete2', (actions) => {
                return [
                  actions.props.patch({ allowCustom: true }),
                  actions.props.patchAsync({
                    options: (field) => {
                      return this.nodeList$$();
                    },
                  }),
                ];
              }),
              v.title('目标'),
              actions.wrappers.set(['td', { type: LinkWrapperComponent }]),
            ),
            description: v.pipe(
              v.string(),
              v.title('描述'),
              formConfig({ updateOn: 'blur' }),
              actions.wrappers.set(['td', { type: ReadonlyWrapperComponent }]),
            ),
            keywords: v.pipe(
              v.optional(v.array(v.string())),
              asControl(),
              formConfig({ updateOn: 'blur' }),
              setComponent('chip-input-list'),
              v.title('关键字'),
              actions.wrappers.set(['td']),
              actions.inputs.patchAsync({
                disableInput: (field) => {
                  return computed(() => {
                    return !field.get(['@table-item'])!.props()?.['editable'];
                  });
                },
                disableDelete: (field) => {
                  return computed(() => {
                    return !field.get(['@table-item'])!.props()?.['editable'];
                  });
                },
              }),
            ),
            __actions: v.pipe(
              v.tuple([
                safeDefine.nfcComponent('button', (actions) => {
                  return [
                    actions.inputs.patch({
                      shape: 'circle',
                      style: 'soft',
                      color: 'primary',
                      size: 'sm',
                    }),
                    actions.inputs.patchAsync({
                      content: (field) => {
                        const editable$$ = computed(() => {
                          return !!field.get(['..', '..'])!.props()?.[
                            'editable'
                          ];
                        });
                        return computed(() => {
                          return editable$$()
                            ? { icon: { fontIcon: 'check' } }
                            : { icon: { fontIcon: 'edit' } };
                        });
                      },
                      clicked: (field) => {
                        const tableItemField = field.get(['@table-item'])!;
                        const index =
                          tableItemField.form.control!.valuePath.slice(
                            -1,
                          )[0] as number;
                        return () => {
                          const needSave =
                            !!tableItemField!.props()['editable'];
                          tableItemField!.props.update((data) => {
                            return {
                              ...data,
                              editable: !data?.['editable'],
                            };
                          });
                          if (needSave) {
                            const value =
                              tableItemField.form.control?.value$$();
                            this.applyEdgeChange(index, value);
                          }
                        };
                      },
                    }),
                  ];
                }),
                safeDefine.nfcComponent('button', (actions) => {
                  return [
                    actions.inputs.patch({
                      shape: 'circle',
                      style: 'soft',
                      color: 'error',
                      content: { icon: { fontIcon: 'close' } },
                      size: 'sm',
                    }),
                    hideWhen({
                      listen: (fn) => {
                        return fn({ list: [['..', '..']] }).pipe(
                          switchMap(({ listenFields: [field] }) => {
                            const editable$$ = computed(() => {
                              return !field.props()?.['editable'];
                            });
                            return toObservable(editable$$, {
                              injector: field.injector,
                            });
                          }),
                        );
                      },
                    }),
                    actions.inputs.patchAsync({
                      clicked: (field) => {
                        return () => {
                          field.get(['..', '..'])!.props.update((data) => {
                            return {
                              ...data,
                              editable: false,
                            };
                          });
                        };
                      },
                    }),
                  ];
                }),
                safeDefine.nfcComponent('button', (actions) => {
                  return [
                    actions.inputs.patch({
                      shape: 'circle',
                      style: 'soft',
                      color: 'error',
                      content: { icon: { fontIcon: 'delete' } },
                      size: 'sm',
                    }),
                    actions.inputs.patchAsync({
                      clicked: (field) => {
                        return () => {
                          const index = field.form.parent!.valuePath.slice(
                            -1,
                          )[0] as number;
                          const arrayField = field.get(['..', '..', '..'])!;

                          return this.deleteEdgeDescription(index).then(() => {
                            return arrayField.action.remove(index);
                          });
                        };
                      },
                    }),
                  ];
                }),
              ]),
              actions.wrappers.patch(['td']),
            ),
          }),

          setAlias('table-item'),
        ),
      ),
      safeDefine.setComponent('table-group', (actions) => {
        return [
          actions.inputs.patch({
            zebra: true,
            range: [0, 10],
            disableAdd: true,
            disableRemove: true,
          }),
          actions.wrappers.patch([
            {
              type: 'div',
              attributes: {
                class: 'rounded-box border border-base-content/5 bg-base-100',
              },
            },
          ]),
        ];
      }),
    ),
    __page: safeDefine.nfcComponent('pagination', (actions) => {
      return [
        actions.class.top('mt-4 flex justify-end'),
        actions.inputs.patch({
          value: {
            size: 10,
            index: 0,
          },
        }),
        actions.inputs.patchAsync({
          count: (field) => {
            const tableField = field.get(['..', 'edge'])!;
            return computed(() => {
              return tableField.children!().length;
            });
          },
        }),
        actions.outputs.patchAsync({
          valueChange: (field) => {
            return (data) => {
              const control = field.get(['..', 'edge'])!;
              const start = data.index * data.size;
              control.inputs.update((inputs) => {
                return {
                  ...inputs,
                  range: [start, start + data.size],
                };
              });
            };
          },
        }),
      ];
    }),
  });
  readonly data = inject(MAT_DIALOG_DATA);
  readonly title = this.data.title;
  readonly parent: PageComponent = this.data.parent;
  #client = inject(TrpcService).client;
  #openDialog = this.data.openDialog as (name: string) => void;
  openMerge$ = signal(true);
  #dialog = inject(MatDialog);
  nodeData = signal(getNodeData(this.title, this.parent.graph$()! as any));
  type = getNodeType(this.nodeData().node);

  nodeList$$ = computed(() => {
    const list = this.parent.graphNodeList$$();
    return list.map((item) => {
      return { value: item, label: item };
    });
  });
  filterWith = (item: string, option: any) => {
    return option.value.includes(item);
  };
  edgeEditStatus = signal<
    Partial<Record<number, { editable: boolean; loading: boolean }>>
  >({});
  nodeEditStatus$ = signal<
    Partial<Record<number, { loading: boolean; description: string }>>
  >({});
  readonly PiyingView = PiyingView;
  piyingInput = {
    schema: this.tableLayout,
    model: this.nodeData(),
    options: {
      fieldGlobalConfig: FieldGlobalConfig,
      context: {
        title: this.title,
        openDialog: this.#openDialog,
      },
    },
    selectorless: true,
  };

  readonly KeywordSeparator = [COMMA, ENTER];

  getNodeTooltip = (node: NodeAttr['list'][number]) => {
    return [`${node.fileName}`].join('\n');
  };
  nodeDescriptionChange(index: number, value: string) {
    this.nodeEditStatus$.update((obj) => {
      obj[index] ??= {} as any;
      obj[index]!.description = value;
      return { ...obj };
    });
  }

  /** 节点描述修改变更(只有一个) */
  changeDescription(index: number) {
    this.nodeEditStatus$.update((obj) => {
      obj[index]!.loading = true;
      return { ...obj };
    });
    const description = this.nodeEditStatus$()[index]!.description;
    this.#client.knowledge.graph.changeNodeDescription
      .query({
        graphName: window.__pageConfig.data.graphName!,
        nodeItem: {
          ...this.nodeData().node.list[index],
          description: description,
        },
      })
      .finally(() => {
        this.nodeData().node.list[index].description = description;
        this.nodeEditStatus$.update((obj) => {
          obj[index]!.loading = false;
          obj[index]!.description = '';
          return { ...obj };
        });
      });
  }
  /** 边修改变更 */
  applyEdgeChange(index: number, value: any) {
    const oldData = this.nodeData().edge[index];
    return this.#client.knowledge.graph.changeEdgeData.query({
      graphName: window.__pageConfig.data.graphName!,
      nodeItem: value,
      oldNode: oldData,
    });
  }

  openMerge() {
    const ref = this.#dialog.open(NodeMergeComponent, {
      data: this.data,
      autoFocus: false,
      maxWidth: '80vw',
      width: '80vw',
    });
    ref.afterClosed().subscribe((value) => {
      if (value) {
        this.#ref.close();
      }
    });
  }
  openOther(name: string, e: MouseEvent) {
    if (name) {
      this.#openDialog(name);
    }
    e.stopPropagation();
    e.preventDefault();
  }
  injector = inject(Injector);

  openNew() {
    const node = this.parent.graph$()!.getNodeAttributes(this.title);
    const ref2 = this.#dialog.open(NodeNewComponent, {
      data: {
        formData: {
          name: this.title,
          chunkId: node.list[0].chunkId,
          fileName: node.list[0].fileName,
          type: getNodeType(node),
        },
        parent: this.data.parent,
      },
      autoFocus: false,
      maxWidth: '80vw',
      width: '80vw',
    });
    ref2.afterClosed().subscribe((value) => {
      if (value) {
        this.#ref.close(true);
      }
    });
  }
  #cd = inject(ChangeDetectorRef);
  deleteNodeLoading$ = signal(false);

  async deleteNodeDescription(index: number) {
    const { submit } = await this.#confirm.open();
    if (!submit) {
      return;
    }
    this.deleteNodeLoading$.set(true);
    return this.#client.knowledge.graph.deleteGraphNode
      .query({
        graphName: window.__pageConfig.data.graphName!,
        options: this.nodeData().node.list[index],
      })
      .then(() => {
        if (this.nodeData().node.list.length === 1) {
          return this.#ref.close(true);
        }
        this.nodeData.update((data) => {
          data.node.list.splice(index, 1);
          data.node.list = data.node.list.slice();
          return { ...data };
        });
        this.#cd.detectChanges();
      })
      .finally(() => {
        this.deleteNodeLoading$.set(false);
      });
  }
  // 删除
  async deleteEdgeDescription(index: number) {
    const { submit } = await this.#confirm.open();
    if (!submit) {
      return;
    }
    return this.#client.knowledge.graph.deleteGraphEdge
      .query({
        graphName: window.__pageConfig.data.graphName!,
        options: this.nodeData().edge[index],
      })
      .then(() => {
        this.nodeData.update((data) => {
          data.edge = data.edge.slice();
          data.edge.splice(index, 1);
          return { ...data };
        });
      });
  }
  #ref = inject(MatDialogRef);
  #confirm = inject(ConfirmService);
  async deleteThis() {
    const { submit } = await this.#confirm.open();
    if (!submit) {
      return;
    }
    this.#client.knowledge.graph.deleteNodeByName.query({
      graphName: window.__pageConfig.data.graphName!,
      name: this.title,
    });
    this.#ref.close();
  }
  edgePage$ = signal({ index: 0, size: 20, start: 0 });
  edgeList$$ = computed(() => {
    const page = this.edgePage$();
    return this.nodeData().edge.slice(page.start, page.start + page.size);
  });
  edgePageChange(event: PageEvent) {
    this.edgePage$.update((item) => {
      return {
        ...item,
        index: event.pageIndex,
        start: event.pageIndex * item.size,
      };
    });
  }
  nodePage$ = signal({ index: 0, size: 20, start: 0 });
  nodeDescriptionList$$ = computed(() => {
    const page = this.nodePage$();
    return this.nodeData().node.list.slice(page.start, page.start + page.size);
  });
  nodePageChange(event: PageEvent) {
    this.nodePage$.update((item) => {
      return {
        ...item,
        index: event.pageIndex,
        start: event.pageIndex * item.size,
      };
    });
  }
}
