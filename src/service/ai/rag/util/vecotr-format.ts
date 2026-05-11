export function edgeVectorString(options: {
  description: string;
  source: string;
  target: string;
  keywords: string[];
}) {
  return `${options.keywords},${options.source},${options.target},${options.description}`;
}
export function nodeVectorString(options: {
  type: string;
  name: string;
  description: string;
}) {
  return `${options.name},${options.description}`;
}
