import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Injectable()
export class ZhPaginatorIntl implements MatPaginatorIntl {
  changes = new Subject<void>();

  firstPageLabel = `首页`;
  itemsPerPageLabel = `每页:`;
  lastPageLabel = `尾页`;

  nextPageLabel = '下一页';
  previousPageLabel = '上一页';

  getRangeLabel(page: number, pageSize: number, length: number): string {
    if (length === 0) {
      return `0 / 0`;
    }
    const amountPages = Math.ceil(length / pageSize);
    return `${page + 1} / ${amountPages}`;
  }
}
