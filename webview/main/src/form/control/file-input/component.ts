import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TrpcService } from '@fe/trpc';
import { BaseControl } from '@piying/view-angular';

import { uniq, uniqBy } from 'lodash-es';
@Component({
  selector: 'file-input',
  templateUrl: 'component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputFCC),
      multi: true,
    },
  ],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
// custom去掉了,不知道在哪里用,因为搜索没搜索到
export class FileInputFCC extends BaseControl {
  static formControlType = 'file-input';
  // 默认是图片
  mode = input<'vscode' | 'file' | 'card' | 'custom' | 'default'>('default');
  /** custom使用 */
  // icon = input<string>();
  clicked = input<() => Promise<any>>();
  /** default使用 */
  label = input<string>();
  placeholder = input<string>();
  /** vscode */
  filterType = input<string>();
  /** file */
  filters = input<Record<string, any>>();
  icon = input('attach_file');
  multi = input<boolean>();
  #client = inject(TrpcService).client;
  changePath() {
    if (this.mode() === 'vscode') {
      this.#client.fs.selectFileByVSCode
        .query({ filterType: this.filterType()! })
        .then((item) => {
          if (item) {
            this.valueChange(item);
          }
        });
      return;
    } else if (this.mode() === 'file') {
      const oldValue = this.value$() || [];
      if (this.filters()) {
        this.#client.fs.selectFiles
          .query({
            title: this.label() ?? '选择文件',
            multi: this.multi() ?? false,
            filters: this.filters(),
          })
          .then((value) => {
            if (!value) {
              return;
            }
            this.valueChange(uniq([...oldValue, ...value]));
          });
      } else {
        this.#client.workflow.selectArticleList
          .query({ title: `选择文件` })
          .then((value) => {
            if (!value) {
              return;
            }
            this.valueChange(uniq([...oldValue, ...value]));
          });
      }
      return;
    } else if (this.mode() === 'card') {
      const oldValue = this.value$() || [];
      this.#client.workflow.selectCard.query(undefined).then((selectedList) => {
        if (!selectedList) {
          return;
        }
        this.valueChange(
          uniqBy([...oldValue, ...selectedList], ({ value }) => value),
        );
      });
      return;
    } else if (this.clicked()) {
      this.clicked()!().then((value) => {
        if (typeof value !== 'undefined') {
          this.valueChange(value);
        }
      });
      return;
    }
    this.#client.fs.selectFiles
      .query({
        title: `请选择图片`,
        multi: false,
        filters: { 图片: ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'webp'] },
      })
      .then((value) => {
        if (!value) {
          return;
        }

        this.valueChange(value);
      });
  }
  removeItem(i: number) {
    const value = this.value$().slice();
    value.splice(i, 1);
    this.valueChange(value);
  }
}
