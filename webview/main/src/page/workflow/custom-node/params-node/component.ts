import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShMarkdownTooltipDirective } from '../../../../directive/markdown-tooltip.directive';
@Component({
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, ShMarkdownTooltipDirective],
  templateUrl: './component.html',
  styleUrl: './component.scss',
  selector: `params-node`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParamsNodeComponent {
  readonly tooltip = [
    '## 编辑器内选中对话',
    '- 传入类型对象 如:`{selection:string}`',
    '- selection: 选中内容',
    '- selectionLine: 选中内容,所在的行',
    '- currentFile: 当前文件',
    '- topLinesX: 前x行,x为数字',
    '- topLineX: 前第x行,同topLinesX',
    '- topFilesX: 前x章的文件,仅文件名命名中带有数字生效,如第一二三章,第一百二十三章,第123章等',
    '- topFileX: 前第x章的文件,同topFiles',
    '## 文本编辑器使用',
    '### 全文对话',
    '- 传入类型 `{content:string}`',
    '### 逐行对话',
    '- 传入类型 `{line:string}`',
    `## 工作流传入`,
    `- chunk: 文本切片`,
    `- fileName: 文件名`,
    `- entityTypeList: 实体类型`,
    `## 图谱关键词提取`,
    `- question: 问题`,
  ].join('\n');
}
