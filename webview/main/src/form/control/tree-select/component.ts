import { OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  SimpleChanges,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ReactOutlet } from '@cyia/ngx-bridge/react-outlet';
import { Tree, TreeProps } from 'antd';
import { BaseControl } from '@piying/view-angular';
import { DataNode } from 'antd/es/tree';
@Component({
  selector: 'cyia-tree-select',
  templateUrl: 'component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TreeSelectFCC),
      multi: true,
    },
  ],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    OverlayModule,
    MatIconModule,
    ReactOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./component.scss'],
})
export class TreeSelectFCC extends BaseControl {
  treeConfig = input<{ data: DataNode[]; multi: boolean }>();
  Tree = Tree;
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['treeConfig'].previousValue) {
      if (this.treeConfig()?.multi) {
        this.keys$.set({ checkedKeys: [] });
      } else {
        this.keys$.set({ selectedKeys: [] });
      }
      this.valueChange([]);
    }
  }
  override writeValue(obj: any): void {
    if (obj) {
      if (this.treeConfig()?.multi) {
        this.keys$.set({ checkedKeys: obj });
      } else {
        this.keys$.set({ selectedKeys: obj });
      }
    }
    super.writeValue(obj);
  }
  onCheck = (data: any) => {
    this.keys$.set({ checkedKeys: data });
    this.valueChange(data);
  };
  onSelect = (data: any[], info: any) => {
    this.keys$.set({ selectedKeys: data });
    this.valueChange(data);
  };
  keys$ = signal<{
    checkedKeys?: any[] | undefined;
    selectedKeys?: any[] | undefined;
  }>({});
  treeProps = computed<TreeProps>(() => {
    const data = this.treeConfig();

    return {
      treeData: data?.data,
      checkable: data?.multi,
      expandedKeys: data?.data.map((item) => item.key),
      onCheck: this.onCheck,
      onSelect: this.onSelect,
      ...this.keys$(),
    };
  });
}
