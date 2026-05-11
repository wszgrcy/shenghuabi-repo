import { CommandPrefix } from '@global';

export function commandFormat(
  commandName: string,
  args: any[],
  options = { usePrefix: true },
) {
  const cmdName = options.usePrefix
    ? `${CommandPrefix}.${commandName}`
    : commandName;
  const argsString = encodeURIComponent(JSON.stringify(args));
  return `command:${cmdName}?${argsString}`;
}
const defaultOptions = { usePrefix: true, addTitle: true };
export function mdCommand(
  name: string,
  commandName: string,
  args: any[],
  options: { usePrefix?: boolean; addTitle?: boolean } = defaultOptions,
) {
  const title = options.addTitle ? JSON.stringify(name) : '" "';

  return `[${name}](${commandFormat(commandName, args, { ...defaultOptions, ...options })} ${title})`;
}
