export interface NodeOptionObject<
  T extends Record<string, any> = Record<string, any>,
> {
  [groupName: string]: {
    enable: boolean;
    value: T;
  };
}
