import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import PageComponent from '../../component';
import { uniq } from 'lodash-es';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { MatCardModule } from '@angular/material/card';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatDialogModule,
    MatChipsModule,
    MatSlideToggleModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    PurePipe,
    MatCardModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['../../../markdown/component.scss'],
})
export class NodeMergeComponent {
  readonly data = inject(MAT_DIALOG_DATA);
  readonly title: string = this.data.title;
  readonly parent: PageComponent = this.data.parent;
  #openDialog = this.data.openDialog as (name: string) => void;
  /** 已经选中,将要提交的 */
  selectedNodeList$ = signal<string[]>([]);
  splitSelectedNodeList$ = signal<string[]>([]);
  /** 自动联想出来可能要合并的 */
  openList$ = computed(() => {
    const trie = this.parent.trie$$();
    const pji = this.parent.passjoinIndex$$();
    if (!trie || !pji) {
      return [];
    }
    const nodeName = this.data.title;
    let list: string[] = [nodeName];
    let i = 0;
    do {
      const lastLength = list.length;
      if (i % 2 === 0) {
        list = uniq(list.flatMap((item) => trie.find(item)));
      } else {
        list = uniq(
          list.flatMap((item) => this.#filterNode([...pji.search(item)], item)),
        );
      }
      i++;
      if (list.length === lastLength && i > 5) {
        break;
      }
    } while (list.length < 10);
    return list.filter((item) => item !== nodeName);
  });
  splitList$$ = computed(() => {
    return this.title
      .split(/、|,|;|；|，/)
      .filter((item) => !!item && item !== this.title);
  });
  splitExtraList$ = signal<string[]>([]);
  /** 合并时手动搜索 */
  searchContent$ = signal('');
  /** 拆分用 */
  splitSearchContent$ = signal('');
  #client = inject(TrpcService).client;
  #filterNode(list: string[], match: string) {
    return list.filter((item) => item.includes(match) || match.includes(item));
  }
  searchResult$ = computed(() => {
    const content = this.searchContent$().toLowerCase();
    if (!content) {
      return [];
    }
    const list = this.parent.graphNodeList$$();
    return list.filter((item) => {
      const str = item.toLocaleLowerCase();
      return (
        str.includes(content) &&
        !this.openList$().includes(str) &&
        this.title !== str
      );
    });
  });
  splitSearchResult$ = computed(() => {
    const content = this.splitSearchContent$().toLowerCase();
    if (!content) {
      return [];
    }
    const list = this.parent.graphNodeList$$();
    return list.filter((item) => item.includes(content));
  });
  mergeExtraList$ = signal<string[]>([]);
  nodeExist = (nodeName: string) => {
    return this.parent.graph$()!.hasNode(nodeName);
  };
  /** 查看节点 */
  viewNode(event: MouseEvent, nodeName: string) {
    event.preventDefault();
    event.stopPropagation();
    this.#openDialog(nodeName);
  }

  /** 添加额外的备选节点 */
  addExtraMergeNode(data: string) {
    if (
      !this.openList$().includes(data) &&
      !this.mergeExtraList$().includes(data) &&
      this.parent.graphNodeList$$().includes(data)
    ) {
      this.mergeExtraList$.update((list) => [...list, data]);
      this.searchContent$.set('');
      this.selectedNodeList$.update((list) => [...list, data]);
    }
  }

  addSplitExtraNode(value: string) {
    if (
      !this.splitList$$().includes(value) &&
      !this.splitExtraList$().includes(value)
    ) {
      this.splitExtraList$.update((list) => [...list, value]);
      this.splitSearchContent$.set('');
      this.splitSelectedNodeList$.update((list) => [...list, value]);
    }
  }
  mergeLoading$ = signal(false);
  #ref = inject(MatDialogRef);
  mergeNode() {
    this.mergeLoading$.set(true);
    this.#client.knowledge.graph.mergeNode
      .query({
        graphName: window.__pageConfig.data.graphName!,
        node: this.title,
        list: this.selectedNodeList$(),
      })
      .then(() => {
        this.selectedNodeList$.set([]);
        this.#ref.close(true);
      })
      .finally(() => {
        this.mergeLoading$.set(false);
      });
  }
  splitLoading$ = signal(false);

  splitNode() {
    this.splitLoading$.set(true);
    this.#client.knowledge.graph.splitNode
      .query({
        graphName: window.__pageConfig.data.graphName!,
        node: this.title,
        list: this.splitSelectedNodeList$(),
      })
      .then(() => {
        this.splitSelectedNodeList$.set([]);
        this.#ref.close(true);
      })
      .finally(() => {
        this.splitLoading$.set(false);
      });
  }
}
