export const BoxPickerboxConfig = {
  type: () =>
    import('./component').then(({ BoxPickerFCC }) => BoxPickerFCC as any),
};
