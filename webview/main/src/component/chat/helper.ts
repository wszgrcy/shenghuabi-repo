export function metadataFormat(item: any) {
  return `${item.type}:${item.description}`;
}

export function metadataTooltipFormat(item: any) {
  return item.tooltip;
}
