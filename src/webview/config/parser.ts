import { parse } from 'yaml';

export function parseYaml(content: string) {
  return parse(content);
}
export function parseJson(content: string) {
  return JSON.parse(content);
}

export async function configContentParse(content: string, filePath?: string) {
  let config: Record<string, any>;
  if (filePath) {
    if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
      config = parseYaml(content);
    } else if (filePath.endsWith('.json')) {
      config = parseJson(content);
    } else {
      throw new Error(`异常文件解析: ${filePath}`);
    }
  } else {
    try {
      config = parseJson(content);
    } catch (error) {
      try {
        config = parseYaml(content);
      } catch (error) {
        throw new Error(`异常解析`);
      }
    }
  }

  return config;
}
