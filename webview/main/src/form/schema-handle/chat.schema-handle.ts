import { NgSchemaHandle } from '@piying/view-angular';
import { omitBy } from 'lodash-es';
import { SchemaOrPipe } from '@piying/valibot-visit';
import * as v from 'valibot';

export class InstallSchemaHandle extends NgSchemaHandle {
  override end(schema: SchemaOrPipe): void {
    super.end(schema);

    // if (this.key && typeof this.key === 'string') {
    //   this.props ??= {};
    // this.props['title'] ??= this.key;
    // }
    const metadata = this.props?.['metadata'];
    if (metadata) {
      if (metadata.inputs) {
        this.inputs = { ...this.inputs, ...metadata.inputs };
      }
    }

    if (this.type === 'number') {
      this.attributes = omitBy(
        {
          ...(this.inputs || {}),
          min: this.props?.['min_value'],
          max: this.props?.['max_value'],
          step: this.props?.['metadata']?.['step'],
        },
        (item) => item === undefined,
      );
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
