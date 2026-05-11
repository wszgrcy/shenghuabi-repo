import { NgSchemaHandle } from '@piying/view-angular';
import { omitBy } from 'lodash-es';
import { SchemaOrPipe } from '@piying/valibot-visit';
import * as v from 'valibot';

export class DefineSchemaHandle extends NgSchemaHandle {
  override end(schema: SchemaOrPipe): void {
    super.end(schema);
    if (
      !this.key &&
      this.children.every((item) => item.children && item.children.length) &&
      this.type === 'intersect'
    ) {
      this.type = 'tab-group';
    }
    if (this.key && typeof this.key === 'string') {
      this.props ??= {};
      this.props['title'] ??= this.key;
    }
    const metadata = this.props?.['metadata'];
    if (metadata) {
      if (metadata.inputs) {
        this.inputs = { ...this.inputs, ...metadata.inputs };
      }
    }

    if (this.type === 'number') {
      this.attributes = omitBy(
        {
          ...(this.attributes || {}),
          min: this.props?.['min_value'],
          max: this.props?.['max_value'],
          step: this.props?.['metadata']?.['step'],
        },
        (item) => item === undefined,
      );
      // if (
      //   'min' in this.inputs &&
      //   'max' in this.inputs &&
      //   'step' in this.inputs
      // ) {
      //   this.type = 'slider';
      //   this.wrappers ??= [
      //     { type: 'tooltip', attributes: { class: 'w-[500px] block' } },
      //     'label',
      //   ];
      //   this.props ??= {};
      //   this.props['labelClass'] = 'w-[200px]';
      // }
    }
  }

  override validation(
    item: v.BaseValidation<any, any, v.BaseIssue<unknown>>,
  ): void {
    super.validation(item);
    if (item.type === 'min_value' || item.type === 'max_value') {
      this.props ??= {};
      this.props[item.type] = (item as any).requirement;
    }
  }
}
