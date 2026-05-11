import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PiyingViewGroupBase } from '@piying/view-angular';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { PurePipe } from '@cyia/ngx-common/pipe';

@Component({
  selector: 'cyia-search-group',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatTabsModule,
    NgTemplateOutlet,
    MatTooltipModule,
    MatInputModule,
    FormsModule,
    PurePipe,
  ],
  styleUrl: './component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFGC extends PiyingViewGroupBase {
  searchLabel = input('搜索');
  searchPlaceholder = input('搜索配置');
  minHeight = input(`0px`);
  searchContent$ = signal('');
  #lazySubject = new Subject<string>();
  canHidden = (
    content: string,
    title?: string,
    description?: string,
    key?: any[],
  ) => {
    if (!content) {
      return false;
    }
    return !(
      title?.includes(content) ||
      description?.includes(content) ||
      key?.join('.').includes(content)
    );
  };

  valueChange(event: any) {
    this.#lazySubject.next(event);
  }
  ngOnInit(): void {
    this.#lazySubject.pipe(debounceTime(200)).subscribe((value) => {
      this.searchContent$.set(value);
    });
  }
}
