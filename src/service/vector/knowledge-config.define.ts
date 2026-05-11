import { KnowledgeItemType } from '../../share/define/knowledge/working-knowledge';

export interface KnowledgeTreeItemData {
  fileName: string;
  dir: string;
  config: KnowledgeItemType;
}
