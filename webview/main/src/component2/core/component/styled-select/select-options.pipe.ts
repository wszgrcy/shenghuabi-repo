import { OnDestroy, Pipe, PipeTransform } from '@angular/core';

export interface FormlySelectOption {
  label: string;
  disabled?: boolean;
  value?: any;
  group?: FormlySelectOption[];
  style?: Record<string, string>;
  icon?: string;
}

export interface FieldSelectProps {
  groupProp?: string | ((option: any) => string);
  labelProp?: string | ((option: any) => string);
  valueProp?: string | ((option: any) => any);
  disabledProp?: string | ((option: any) => boolean);
}

type ITransformOption = {
  labelProp: (option: any) => string;
  valueProp: (option: any) => any;
  disabledProp: (option: any) => boolean;
  groupProp: (option: any) => string;
};

@Pipe({ name: 'selectOptions', standalone: true })
export class SelectOptionsPipe implements PipeTransform, OnDestroy {
  transform(options: any[], field?: FieldSelectProps): FormlySelectOption[] {
    return this.transformOptions(options, field);
  }

  ngOnDestroy(): void {}

  private transformOptions(
    options: any[],
    field?: FieldSelectProps,
  ): FormlySelectOption[] {
    const to = this.transformSelectProps(field);

    const opts: FormlySelectOption[] = [];
    const groups: { [id: string]: number } = {};

    options?.forEach((option) => {
      const o = this.transformOption(option, to);
      if (o.group) {
        const id = groups[o.label];
        if (id === undefined) {
          groups[o.label] = opts.push(o) - 1;
        } else {
          o.group.forEach((o) => opts[id].group!.push(o));
        }
      } else {
        opts.push(o);
      }
    });

    return opts;
  }

  private transformOption(
    option: any,
    props: ITransformOption,
  ): FormlySelectOption {
    const group = props.groupProp(option);
    if (Array.isArray(group)) {
      return {
        label: props.labelProp(option),
        group: group.map((opt) => this.transformOption(opt, props)),
        style: {},
      };
    }

    option = {
      ...option,
      label: props.labelProp(option),
      value: props.valueProp(option),
      disabled: !!props.disabledProp(option),
      style: option.style,
    };

    if (group) {
      return { label: group, group: [option], style: {} };
    }

    return option;
  }

  private transformSelectProps(optionMap?: FieldSelectProps): ITransformOption {
    const selectPropFn = (prop: any) =>
      typeof prop === 'function' ? prop : (o: any) => o[prop];

    return {
      groupProp: selectPropFn(optionMap?.['groupProp'] || 'group'),
      labelProp: selectPropFn(optionMap?.['labelProp'] || 'label'),
      valueProp: selectPropFn(optionMap?.['valueProp'] || 'value'),
      disabledProp: selectPropFn(optionMap?.['disabledProp'] || 'disabled'),
    };
  }
}
