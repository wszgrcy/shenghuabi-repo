import { KnowledgeManagerService } from '@shenghuabi/knowledge/knowledge';
import { inject, RootStaticInjectOptions } from 'static-injector';

export class CustomGraphService extends RootStaticInjectOptions {
  #knowledgeManager = inject(KnowledgeManagerService);
}
