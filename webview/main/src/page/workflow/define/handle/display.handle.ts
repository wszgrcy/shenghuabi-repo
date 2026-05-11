import { NgSchemaHandle } from '@piying/view-angular';
import { MetadataWorkOn, SchemaOrPipe } from '@piying/valibot-visit';

export class Displayhandle extends NgSchemaHandle {
  override defineSchema(schema: SchemaOrPipe): void {
    if (
      this.globalConfig.environments.includes('default') ||
      schema.type === 'object' ||
      schema.type === 'loose_object' ||
      schema.type === 'intersect'
    ) {
      super.defineSchema(schema);
    } else {
    }
  }
  override metadataHandle(
    metadata: any,
    environments: string[],
    workOn: MetadataWorkOn,
  ) {
    if (metadata.type === 'viewRawConfig') {
      if (
        (this.globalConfig.environments === environments &&
          this.globalConfig.environments.includes('default')) ||
        (this.globalConfig.environments !== environments &&
          this.globalConfig.environments.some((item) =>
            environments.includes(item),
          ))
      ) {
        super.metadataHandle(metadata, environments, workOn);
      }
      return;
    }

    super.metadataHandle(metadata, environments, workOn);
  }
}
