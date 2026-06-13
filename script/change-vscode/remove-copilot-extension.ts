import { join } from 'path';
import { rm } from 'fs/promises';

async function removeCopilotExtension() {
  let VSCODE_REL_PATH = './lib/vscode';
  let copilotPath = join(process.cwd(), VSCODE_REL_PATH, 'extensions/copilot');
  
  console.log(`准备删除文件夹: ${copilotPath}`);
  await rm(copilotPath, { recursive: true, force: true });
  console.log('已删除 extensions/copilot 文件夹');
}

removeCopilotExtension();
