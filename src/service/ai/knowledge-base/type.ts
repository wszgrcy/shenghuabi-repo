export type ChatMetadataReference =
  | {
      type: 'knowledge';
      knowledgeName: string;
      fileName: string;
      loc?: {
        lines: {
          from: number;
          to: number;
        };
      };
    }
  | {
      type: 'dict';
      word: string;
      content: string;
    }
  | {
      type: 'card';
      fileName: string;
    }
  | {
      type: 'url';
      title: string;
      url: string;
    };
export interface ChatMetadata {
  type: string;
  description: string;
  tooltip?: string;
  reference?: ChatMetadataReference;
}
