import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NodeBase } from '../node.base';

@Component({
  standalone: true,
  templateUrl: './container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContainerComponent extends NodeBase<any> {}
