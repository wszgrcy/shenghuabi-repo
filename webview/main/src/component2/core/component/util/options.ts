export interface Option1 {
  label: string;
  value: any;
  disabled?: boolean;
  type?: 'option';
  description?: string;
}
export interface OptionGroup {
  disabled?: boolean;
  label: string;
  children: Option1[];
  type: 'group';
  description?: string;
}
export interface ResolvedOption {
  label: string;
  value: any;
  disabled?: boolean;
  type: 'option' | 'group';
  children?: ResolvedOption[];
  description?: string;
}
export interface OptionConvert {
  label: (input: any) => string;
  description: (input: any) => string;
  value: (input: any) => any;
  isGroup: (input: any) => boolean;
  children: (input: any) => any[];
  disabled?: (input: any) => boolean;
}
export type Option2 = string;

export const DefaultOptionConvert: OptionConvert = {
  label: (item) => (typeof item === 'string' ? item : item.label),
  description: (item) => item.description,
  value: (item) => (typeof item === 'string' ? item : item.value),
  disabled: (item) => typeof item === 'object' && item.disabled,
  isGroup: (item) => typeof item === 'object' && item.type === 'group',
  children: (item) => item.children,
};

export function transformOptions(
  options: any[],
  optionConvert: OptionConvert,
): ResolvedOption[] {
  return options.map((option) => {
    const resolvedItem: ResolvedOption = {
      ...option,
      label: optionConvert.label(option),
      value: optionConvert.value(option),
      disabled: optionConvert.disabled?.(option) ?? false,
      type: 'option',
      description: optionConvert.description(option),
    };
    if (optionConvert.isGroup(option)) {
      resolvedItem.type = 'group';
      resolvedItem.children = transformOptions(
        optionConvert.children(option),
        optionConvert,
      );
      return resolvedItem;
    }
    return resolvedItem;
  });
}
