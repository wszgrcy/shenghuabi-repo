import { InjectionToken, Signal } from 'static-injector';
import { KnowledgeItemType } from '../../share/define/knowledge/working-knowledge';

export const OriginConfigToken = new InjectionToken<Signal<KnowledgeItemType>>(
  'OriginConfig',
);
