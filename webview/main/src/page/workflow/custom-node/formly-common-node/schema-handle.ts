import { Schema } from '@piying/valibot-visit';
import { NgSchemaHandle } from '@piying/view-angular';
import { actions } from '@piying/view-angular-core';

export class CreateSchemaHandle extends NgSchemaHandle {
  override afterSchemaType(schema: Schema): void {
    super.afterSchemaType(schema);
    if (this.nonFieldControl) {
      return;
    }
    this.metadataHandle(
      actions.wrappers.patch(['flow-handle']) as any,
      this.globalConfig.environments,
      'init',
    );
  }
}
