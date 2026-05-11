export function workflowMigrate(input: {
  version: number;
  [name: string]: any;
}) {
  const update = false;
  // try {
  //   if (input.version === 2) {
  //     (input as any).flow = toV3((input as any).flow) as any;
  //     input.version = 3;
  //     update = true;
  //     input['update'] = Date.now();
  //   }
  // } catch (error) {
  //   console.error(`迁移到v3版本时失败`);
  //   if (error instanceof Error) {
  //     error.message = `迁移到v3版本时失败:${error.message}`;
  //   }
  //   throw error;
  // }

  //! 注意工作流版本要同步更新
  return { input, update };
}
