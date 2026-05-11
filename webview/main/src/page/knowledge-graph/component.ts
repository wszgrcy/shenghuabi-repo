import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { TrpcService } from '@fe/trpc';
import Graph from 'graphology';
import Sigma from 'sigma';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EdgeAttr, formatNode, getNodeType, NodeAttr } from '@bridge/share';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { Trie } from 'mnemonist';
import { PassjoinIndex } from 'mnemonist';
import { distance } from 'fastest-levenshtein';
import { NodeEditComponent } from './dialog/edit/component';
import { NodeNewComponent } from './dialog/add-node/component';
import circlepack from 'graphology-layout/circlepack';
import { xoroshiro128plus } from 'pure-rand';
import louvain from 'graphology-communities-louvain';
import {
  drawDiscNodeHover,
  drawDiscNodeLabel,
  NodeCircleProgram,
} from 'sigma/rendering';
import { interpolateRgbBasis } from 'd3-interpolate';
import { debounce } from 'lodash-es';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
const rng = xoroshiro128plus(100);
const rngFn = () => {
  return (rng.unsafeNext() >>> 0) / 0x1_0000_0000;
};
const maxSize = 15;
function calculateValue(count: number) {
  if (count < 100) {
    return maxSize;
  }

  let value = maxSize;
  while (count >= 100 && value > 2) {
    count /= 10;
    value /= 2;
  }

  return Math.max(value, 2) | 0;
}
/**
 * 点击合并后弹出一个chip?和下面的按钮,点击后直接进到列表中,列表不允许收入只能删除,但是可以点击链接查看
 */
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  host: {
    '[style.cursor]': 'cursor$()',
  },
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PageComponent {
  #client = inject(TrpcService).client;
  #elRef: HTMLElement = inject(ElementRef).nativeElement;
  #dialog = inject(MatDialog);
  cursor$ = signal<string>('');
  searchContent$ = signal('');
  graph$ = signal<Graph<NodeAttr, EdgeAttr> | undefined>(undefined);
  graphNodeList$$ = computed(() => {
    const graph = this.graph$();
    if (!graph) {
      return [];
    }
    return graph.mapNodes((node) => node);
  });
  searchResult$ = computed(() => {
    const content = this.searchContent$().toLowerCase();
    if (!content) {
      return [];
    }
    const list = this.graphNodeList$$();
    return list.filter((item) => item.includes(content)).slice(0, 50);
  });
  sigma!: Sigma;
  trie$$ = computed(() => {
    const graph = this.graph$();
    if (!graph) {
      return undefined;
    }
    return Trie.from(graph.nodes());
  });
  passjoinIndex$$ = computed(() => {
    const graph = this.graph$();
    if (!graph) {
      return undefined;
    }
    return PassjoinIndex.from(graph.nodes(), distance, 1);
  });
  #graphCache = {} as Record<string, any>;
  inited$ = signal(false);
  count$ = signal({
    node: 0,
    edge: 0,
  });
  async ngOnInit() {
    const config = await this.#client.common.getConfig.query(
      'knowledgeGraph.view',
    );
    let dynamicRatio = 1;
    function getDynamicSize(data: any) {
      return Math.min(data.size * dynamicRatio, maxSize);
    }
    // 动态节点变更
    function customNodeProgram() {
      return class extends NodeCircleProgram {
        override processVisibleItem(
          nodeIndex: number,
          startIndex: number,
          data: any,
        ) {
          super.processVisibleItem(nodeIndex, startIndex, {
            ...data,
            size: getDynamicSize(data),
          });
        }
      };
    }
    // let a = Date.now();
    const colorFn = interpolateRgbBasis(config.color);
    let lastGraph: Graph | undefined;
    this.#client.knowledge.getGraph.subscribe(
      {
        name: window.__pageConfig.data.graphName!,
      },
      {
        onData: (result) => {
          if (!result) {
            return;
          }
          const attr = result.attributes;
          // console.log('用时', Date.now() - a);
          if (lastGraph) {
            lastGraph.forEachNode((nodeName, attr) => {
              this.#graphCache[nodeName] = attr;
            });
          }
          const graph = new Graph({ type: 'directed' });
          lastGraph = graph;
          // todo 应该是下一次出现的时候备份
          graph.import(result);
          this.count$.update(() => {
            return { edge: graph.size, node: graph.order };
          });
          let count: number;
          if (config.coloringMethod === 'community') {
            if (graph.order) {
              louvain.assign(graph, {
                nodeCommunityAttribute: 'community',
                resolution: 0.8,
                rng: rngFn,
                getEdgeWeight: (edge, attr) => {
                  return attr?.['list']?.length || 1;
                },
              });
              // console.log('调用后用时1', Date.now() - a);

              const louvainResult = louvain.detailed(graph);
              count = louvainResult.count;
            } else {
              count = 0;
            }
            // console.log('调用后用时2', Date.now() - a);
          } else {
            const entityObj = (attr['entityTypeList'] as string[]).reduce(
              (obj, item, index) => {
                obj[item] = index;
                return obj;
              },
              {} as Record<string, number>,
            );
            graph.forEachNode((nodeName, attr) => {
              attr[config.coloringMethod] = entityObj[getNodeType(attr as any)];
            });
            count = (attr['entityTypeList'] as string[]).length;
          }

          circlepack.assign(graph, {
            hierarchyAttributes: [config.coloringMethod],
            rng: rngFn,
          });
          const size = calculateValue(graph.order);
          graph.forEachNode((nodeName, attr) => {
            attr['label'] = attr['list'][0].name;
            attr['size'] = size;
            // attr['size'] = (6 + 4 * Math.log(attr['list'].length)) / 2;
            attr['color'] = colorFn(1 - attr[config.coloringMethod] / count);
          });
          graph.forEachEdge((node, attr) => {
            attr['size'] = 1;
            attr['type'] = 'arrow';
          });
          // console.log('调用后用时', Date.now() - a);

          this.graph$.set(graph as any);
          // 布局和其他的是一次性初始化
          if (!this.sigma) {
            this.sigma = new Sigma(graph, this.#elRef, {
              renderEdgeLabels: false,
              renderLabels: true,
              nodeProgramClasses: {
                circle: customNodeProgram(),
              },
              defaultDrawNodeHover: (ctx, data, settings) => {
                return drawDiscNodeHover(
                  ctx,
                  {
                    ...data,
                    size: getDynamicSize(data),
                  },
                  settings,
                );
              },
              defaultDrawNodeLabel: (ctx, data, settings) => {
                return drawDiscNodeLabel(
                  ctx,
                  {
                    ...data,
                    size: getDynamicSize(data),
                  },
                  settings,
                );
              },
            });
            this.inited$.set(true);
            // 拖动
            let draggedNode: string | null = null;
            let isDragging = false;
            let nodeMoved = false;
            this.sigma.on('downNode', (e) => {
              isDragging = true;
              draggedNode = e.node;
              nodeMoved = false;
            });
            const updateFn = debounce(() => {
              dynamicRatio = Math.max(
                1,
                Math.min(
                  6,
                  Math.log(this.sigma.getGraphToViewportRatio() / 3 + 1),
                ),
              );

              this.sigma.refresh();
            }, 50);
            this.sigma.getCamera().on('updated', (state) => {
              updateFn();
            });
            // 鼠标移动
            this.sigma.getMouseCaptor().on('mousemovebody', (e) => {
              if (!isDragging || !draggedNode) return;

              const pos = this.sigma.viewportToGraph(e);
              const graph = this.sigma.getGraph();
              graph.setNodeAttribute(draggedNode, 'x', pos.x);
              graph.setNodeAttribute(draggedNode, 'y', pos.y);

              e.preventSigmaDefault();
              e.original.preventDefault();
              e.original.stopPropagation();
              nodeMoved = true;
            });

            this.sigma.getMouseCaptor().on('mouseup', () => {
              // if (draggedNode) {
              //   graph.removeNodeAttribute(draggedNode, 'highlighted');
              // }
              isDragging = false;
              draggedNode = null;
            });

            this.sigma.getMouseCaptor().on('mousedown', () => {
              if (!this.sigma.getCustomBBox()) {
                this.sigma.setCustomBBox(this.sigma.getBBox());
              }
            });
            this.sigma.on('clickNode', (payload) => {
              if (!nodeMoved) {
                this.#openDialog(payload.node);
              }
            });
            this.sigma.on('enterNode', () => {
              this.cursor$.set('pointer');
            });
            this.sigma.on('leaveNode', () => {
              this.cursor$.set('');
            });
          } else {
            this.sigma['hoveredNode'] = null;
            this.sigma.setGraph(graph);
          }
        },
      },
    );
  }
  #openDialog(name: string) {
    const attr = this.graph$()!.getNodeAttributes(name);

    this.#dialog.open(NodeEditComponent, {
      data: {
        title: name,
        content: formatNode(name, attr as any, this.graph$() as any, true),
        openDialog: (name: string) => this.#openDialog(name),
        parent: this,
      },
      autoFocus: false,
      maxWidth: '80vw',
    });
  }
  searchChange(value: string) {
    const displayData = this.sigma.getNodeDisplayData(value)!;
    this.sigma
      .getCamera()
      .animate(displayData, {
        duration: 500,
      })
      .then(() => {
        this.sigma.getCamera().animatedZoom({ duration: 500, factor: 6 });
      });
  }
  openNew() {
    this.#dialog.open(NodeNewComponent, {
      data: {
        formData: {},
        parent: this,
      },
      autoFocus: false,
      maxWidth: '80vw',
      width: '80vw',
    });
  }
  openNode(event: MouseEvent) {
    event.stopPropagation();

    this.#openDialog(this.searchContent$());
  }
}
