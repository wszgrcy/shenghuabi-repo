import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import * as v from 'valibot';
import { CustomNode } from '../../type';
import { FormsModule } from '@angular/forms';
import { ValueFormatDirective } from '../../../../directive/value-format.directive';
@Component({
  selector: 'default-node',
  templateUrl: './component.html',
  styleUrl: './component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ValueFormatDirective],
})
export class DefaultNodeComponent {
  define = input<v.BaseSchema<any, any, any>>();
  props = input.required<CustomNode>();
}
