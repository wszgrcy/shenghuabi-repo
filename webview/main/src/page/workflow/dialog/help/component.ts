import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MarkdownPipe } from '../../../../pipe/markdown.pipe';

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [MatDialogModule, MarkdownPipe],
  styleUrls: ['./component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MindHelpComponent {
  readonly content = [
    `### 连接`,
    '- 入口部分参数通常为文本模板或配置自动确定需要的参数',
    '- 左侧为入口部分,右侧为出口部分',
    '- 入口部分只接受一个边连接,出口部分可以连接多个节点入口',
    '- `扁平数组`: 使用此出口将返回结果转换为一维数组',
    '- `第一项`: 使用此出口将返回结果扁平后的第一个值',
    `### 节点类型`,
    '- 普通节点: 可能有一个或多个出口,但是多个出口可以同时使用,仅作为不同格式输出.如`对话`,`文件输入`节点',
    '> 比如`文件输入`节点有多个出口,不同出口返回不同格式的数据',
    '- 条件节点: 可以设置多个出口,但是只能有一个出口生效.如`条件`,`分类器`',
    '- 容器节点: 目前只有一个迭代,用于处理列表数据,',
    `### 通用设置`,
    '- 显示配置/隐藏配置: 默认情况下,点击节点会同时展开设置(如果有),可以通过此设置禁止',
    '- 包含此节点/排除此节点: 默认情况下,所有节点都应该被使用,可以通过此设置禁止节点使用但不引发异常',
    '> 一般用于临时调整.被禁用的节点会显示红色边框',
    '- 选择出口: 当节点有多个出口,并且出口没有被其他节点连接时(即可能为返回值),需要选择默认返回',
    `### **[连接点]**`,
    '- 大多数节点中存在的入口连接点,可以用于条件类型节点(`条件`,`分类`)调用',
    '- 比如`对话`, `条件`出口与`对话`[连接点]连接,仅表示它是下一个执行的节点',
    `- 当只有一个连接点时,表示一个唯一输入`,
    '- 比如`数组合并`,因为必须传入一个数组变量,所以合并输入和连接点为一个',
    `### 操作`,
    '- 选中节点 `Ctrl+C` 复制节点',
    '- 点击空白 `Ctrl+V` 粘贴节点',
    '- 选中边 `Del` 删除节点或边',
  ].join('\n');
}
