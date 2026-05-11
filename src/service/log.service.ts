import { errorFormatByNode } from '@share/util/format/error-format-node';
import { commandFormat } from '@share/util/hover/command-format';
import {
  computed,
  createInjector,
  inject,
  InjectionToken,
  Injector,
  RootStaticInjectOptions,
} from 'static-injector';
import * as vscode from 'vscode';

type Data = Parameters<
  Parameters<Parameters<typeof vscode.window.withProgress>['1']>[0]['report']
>[0];
class ProgressItem {
  constructor(
    private progress: vscode.Progress<Data>,
    private endResolve: (value: any) => any,
    private title: string,
  ) {}
  loading(data: Data) {
    this.progress!.report({
      ...data,
      message: this.#commandList.join('|') + data.message,
    });
  }
  #commandList: string[] = [];
  setCommand(
    list: {
      title: string;
      command: {
        commandName: string;
        args: any;
        options: { usePrefix: boolean };
      };
    }[],
  ) {
    this.#commandList = list.map(({ title, command }) => {
      return `[${title}](${commandFormat(command.commandName, command.args, command.options)})`;
    });
  }
  end() {
    this.endResolve!(undefined);
  }
  endWithMessage(message: string) {
    this.endResolve!(undefined);
    vscode.window.showInformationMessage(
      `[${this.title}]完成 ${message}`.trim(),
    );
  }
  endWithError(value: string) {
    this.end();
    vscode.window.showErrorMessage(value);
  }
  /** 正常下不应该使用 */
  next(value: any) {
    if (value.data?.content) {
      this.progress.report({ message: value.data.content });
    }
  }
  /** 正常下不应该使用 */
  error(err: any) {}
  /** 正常下不应该使用 */
  complete() {}
}

const ChannelMessage = {
  chat: {
    name: 'chat',
    label: '对话',
  },
  qdrant: {
    name: 'qdrant',
    label: '向量数据库',
  },
  text2vec: {
    name: 'text2vec',
    label: '文本到向量',
  },

  mind: {
    name: 'mind',
    label: '脑图',
  },
  workflow: {
    name: 'workflow',
    label: '工作流',
  },
  download: {
    name: 'download',
    label: '下载',
  },
  ocr: {
    name: 'ocr',
    label: '光学字符识别',
  },

  knowledge: {
    name: 'knowledge',
    label: '知识库',
  },
  'llama.cpp': {
    name: 'llama.cpp',
    label: 'llama.cpp',
  },
  TTS: {
    name: 'TTS',
    label: '文本生成语音',
  },
  system: {
    name: 'system',
    label: '系统',
  },
};
export type ChannelName = keyof typeof ChannelMessage;
const NameToken = new InjectionToken<ChannelName>('Name');
export class LogService {
  #name = inject(NameToken);
  activeProgress?: Promise<ProgressItem>;

  #channel = computed(() => {
    return vscode.window.createOutputChannel(ChannelMessage[this.#name].label, {
      log: true,
    });
  });
  #formatInfo(args: any[]) {
    return args.map((item) => errorFormatByNode(item)).join(' ');
  }
  showChannel() {
    this.#channel().show();
  }
  createProgress(title: string) {
    if (this.activeProgress) {
      this.info(title);
      return;
    }
    this.activeProgress = new Promise<ProgressItem>((res) => {
      vscode.window.withProgress(
        { title, location: vscode.ProgressLocation.Notification },
        (progress) => {
          return new Promise((resolve) => {
            res(new ProgressItem(progress, resolve, title));
          });
        },
      );
    });
  }
  loading(data: Data) {
    this.activeProgress?.then((progress) => {
      progress.loading(data);
    });
  }
  info(...args: any[]) {
    const info = this.#formatInfo(args);
    this.activeProgress?.then((progress) => {
      progress.loading({ message: info });
    });
    this.#channel().info(info);
  }
  debug(...args: any[]) {
    this.#channel().debug(this.#formatInfo(args));
  }

  endProgress() {
    this.activeProgress?.then((item) => {
      item.end();
    });
    this.activeProgress = undefined;
  }
  success(...args: any[]) {
    const info = this.#formatInfo(args);
    if (this.activeProgress) {
      this.activeProgress.then((progress) => {
        progress.end();
      });
      this.activeProgress = undefined;
    }
    vscode.window.showInformationMessage(info);
  }
  warn(...args: any[]) {
    const info = this.#formatInfo(args);
    // 警告不应该停止
    this.#channel().warn(info);

    vscode.window.showWarningMessage(info);
  }
  failed(...args: any[]) {
    const info = this.#formatInfo(args);
    if (this.activeProgress) {
      this.activeProgress.then((progress) => {
        progress.end();
      });
      this.activeProgress = undefined;
    }
    this.#channel().error(info);
    vscode.window.showErrorMessage(info);
  }
  setCommand(
    list: {
      title: string;
      command: {
        commandName: string;
        args: any;
        options: { usePrefix: boolean };
      };
    }[],
  ) {
    return this.activeProgress?.then((item) => item.setCommand(list));
  }
}
export class LogFactoryService extends RootStaticInjectOptions {
  #logMap = new Map<string, LogService>();
  #injector = inject(Injector);
  getLog(name: ChannelName) {
    let item = this.#logMap.get(name);
    if (!item) {
      const injector = createInjector({
        providers: [LogService, { provide: NameToken, useValue: name }],
        parent: this.#injector,
      });
      item = injector.get(LogService);
      this.#logMap.set(name, item);
    }
    return item;
  }
}
