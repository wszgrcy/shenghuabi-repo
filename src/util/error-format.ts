// todo 改到share中
export function errorFormat(input: any) {
  if (input instanceof TypeError) {
    return JSON.stringify({
      name: input.name,
      message: input.message,
      stack: input.stack,
      cause: input.cause,
    });
  } else if (input instanceof Error) {
    return JSON.stringify({
      name: input.name,
      message: input.message,
      stack: input.stack,
    });
  } else if (input && typeof input === 'object') {
    return JSON.stringify(input);
  } else {
    return `${input}`;
  }
}
