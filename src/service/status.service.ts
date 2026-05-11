import { inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { ExtensionConfig } from './config.service';
import { interpolateRgbBasis } from 'd3-interpolate';
import { CommandPrefix } from '@global';
import { mdCommand } from '../util/hover/command-format';
import { WorkspaceService } from './workspace.service';
const colorInterpolate = interpolateRgbBasis([
  'red',
  'yellow',
  'lime',
  'darkorange',
]);
class ExternalStatus {
  #status;
  constructor(
    sort: number,
    public prefix: string,
    command?: vscode.Command,
    tooltip?: string,
  ) {
    this.#status = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      sort,
    );
    if (command) {
      this.#status.command = command;
    }
    if (tooltip) {
      const md = new vscode.MarkdownString(tooltip);
      md.isTrusted = true;
      md.supportThemeIcons = true;
      this.#status.tooltip = md;
    }
    this.#setStatus(`未知`);
    this.#status.show();
  }
  #setStatus(value: string) {
    this.#status.text = `${this.prefix}: ${value}`;
  }
  setSuccessMessage(value: string) {
    this.#setStatus(value);
    this.#status.backgroundColor = undefined;
  }
  setErrorMessage(value: string) {
    this.#setStatus(value);
    this.#status.backgroundColor = new vscode.ThemeColor(
      `statusBarItem.errorBackground`,
    );
  }
}
export class StatusService extends RootStaticInjectOptions {
  wordBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1000,
  );
  qdrant = new ExternalStatus(
    0,
    '向量数据库',
    {
      command: `${CommandPrefix}.showChannel`,
      arguments: ['qdrant'],
      title: '',
    },
    `- ${mdCommand('打开软件文件夹', 'external.call', [
      {
        name: 'qdrant',
        method: 'openDir',
      },
    ])}`,
  );
  text2vec = new ExternalStatus(
    0,
    '文本到向量模型',
    {
      command: `${CommandPrefix}.showChannel`,
      arguments: ['text2vec'],
      title: '',
    },
    `- ${mdCommand('打开模型文件夹', 'external.call', [
      {
        name: 'text2vec',
        method: 'openModelDir',
      },
    ])}`,
  );

  llamacpp = new ExternalStatus(
    0,
    '大语言模型启动器(llama.cpp)',
    {
      command: `${CommandPrefix}.showChannel`,
      arguments: ['llama.cpp'],
      title: '',
    },
    `- ${mdCommand(
      '$(play)启动',
      'external.call',
      [
        {
          name: 'llama.cpp',
          method: 'start',
        },
      ],
      { addTitle: false, usePrefix: true },
    )}\n- ${mdCommand(
      '$(stop)停止',
      'external.call',
      [
        {
          name: 'llama.cpp',
          method: 'stop',
        },
      ],
      { addTitle: false, usePrefix: true },
    )}\n- ${mdCommand('打开软件文件夹', 'external.call', [
      {
        name: 'llama.cpp',
        method: 'openDir',
      },
    ])}`,
  );
  ocr = new ExternalStatus(
    0,
    '光学字符识别',
    {
      command: `${CommandPrefix}.showChannel`,
      arguments: ['ocr'],
      title: '',
    },
    `- ${mdCommand('打开软件文件夹', 'external.call', [
      {
        name: 'ocr',
        method: 'openDir',
      },
    ])}`,
  );
  pythonAddon = new ExternalStatus(
    0,
    '附加工具(IndexTTS)',
    {
      command: `${CommandPrefix}.showChannel`,
      arguments: ['TTS'],
      title: '',
    },
    `- 超时自动停止\n- ${mdCommand(
      '$(stop)停止',
      'external.call',
      [
        {
          name: 'pythonAddon',
          method: 'stop',
        },
      ],
      { addTitle: false, usePrefix: true },
    )}\n- ${mdCommand(
      '清理音频切片缓存',
      'external.call',
      [
        {
          name: 'pythonAddon',
          method: 'clearChunk',
        },
      ],
      { addTitle: false, usePrefix: true },
    )}\n- ${mdCommand('打开文件夹', 'external.call', [
      {
        name: 'pythonAddon',
        method: 'openDir',
      },
    ])}`,
  );
  syncArticle = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    1001,
  );
  /** 下方字统计变更 */
  wordChange(value: number) {
    const config = ExtensionConfig['word.threshold']();
    let max: number | undefined;
    for (let i = 0; i < config.length; i++) {
      const item = config[i];
      if (value < item) {
        max = item;
        break;
      }
    }
    if (!max) {
      max = config[2];
    }
    const percentColor = colorInterpolate(Math.min(1, value / config[2]));
    this.wordBar.text = `共 ${value} / ${max} 字`;
    this.wordBar.color = percentColor;
    this.wordBar.show();
  }
  #workspace = inject(WorkspaceService);
  constructor() {
    super();
    this.wordBar.show();
    // 依赖工作区
    const nFolder = this.#workspace.nFolder();
    if (nFolder) {
      // 文章同步
      this.syncArticle.command = `${CommandPrefix}.syncArticle`;
      this.syncArticle.text = `$(refresh)`;
      this.syncArticle.tooltip = `同步文章索引到数据库`;
      this.syncArticle.show();
    }
  }
}
