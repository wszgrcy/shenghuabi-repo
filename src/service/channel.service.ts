import { computed, inject, RootStaticInjectOptions } from 'static-injector';
import * as vscode from 'vscode';
import { LogFactoryService } from './log.service';
export const TEST_CHANNEL = computed(() =>
  vscode.window.createOutputChannel('测试', { log: true }),
);
export function channelLog(data: any) {
  TEST_CHANNEL().info(typeof data === 'string' ? data : JSON.stringify(data));
}
// 混合2
export class ChannelService extends RootStaticInjectOptions {
  #logFactory = inject(LogFactoryService);
  show(value: string) {
    this.#logFactory.getLog(value as any).showChannel();
  }
}
