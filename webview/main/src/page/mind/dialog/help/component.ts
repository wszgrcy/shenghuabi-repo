import { Component } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatDialogModule, MatChipsModule],
})
export class MindHelpComponent {
  list = [
    { label: '选中节点', shortcut: ['左键单击'] },
    { label: '拖动节点', shortcut: ['未选中时按住左键拖动'] },
    { label: '拖动画布', shortcut: ['空白处按住左键拖动'] },
    { label: '多选', shortcut: ['按住Shift+左键框选', '按住Ctrl点击'] },
    { label: '缩放', shortcut: ['滚轮'] },
    { label: '节点删除', shortcut: ['选中+Delete', '右键->删除'] },
    { label: '边删除', shortcut: ['选中+Delete', '边中间->删除'] },
    { label: '布局', shortcut: ['右键->布局'] },
    { label: '复制节点', shortcut: ['选中+`Ctrl+C`', '右键->复制'] },
    { label: '粘贴节点', shortcut: ['点击空白+`Ctrl+V`', '右键->粘贴'] },
  ];
}
