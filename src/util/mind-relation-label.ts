export function setMindRelationLabel(
  edgeLabel: any | undefined,
  nodeLabel: string | undefined,
  reverse = false,
) {
  nodeLabel = nodeLabel || `[未命名]`;
  if (edgeLabel) {
    if (reverse) {
      return `${edgeLabel}<=${nodeLabel}`;
    } else {
      return `${edgeLabel}=>${nodeLabel}`;
    }
  }
  return nodeLabel;
}
