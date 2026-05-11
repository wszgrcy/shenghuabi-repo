import { commandFormat } from './command-format';

export function wrapALink(
  name: string,
  commandOptions: Parameters<typeof commandFormat>,
) {
  return `<a href="${commandFormat(...commandOptions)}">${name}</a>`;
}
