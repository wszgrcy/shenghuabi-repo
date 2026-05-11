import { initTRPC } from '@trpc/server';
import { Injector } from 'static-injector';
import { CreateContextOptions } from '@cyia/vscode-trpc/server';
import * as vscode from 'vscode';
import { errorFormatByNode } from '@share/util/format/error-format-node';
import { ChannelName, LogFactoryService } from '../service/log.service';
import { captureException } from '@sentry/node';
export const t = initTRPC
  .context<{ injector: Injector } & CreateContextOptions>()
  .create({
    isServer: true,
    errorFormatter: (data) => {
      try {
        const { shape, error, ctx } = data;
        captureException(error.cause ?? error);
        const message = `[${data.path}] ${errorFormatByNode(error.cause ?? error)} ${JSON.stringify(data.input)}`;
        vscode.window.showErrorMessage(message);
        return {
          code: shape.code,
          message: message,
          data: shape.data,
        };
      } catch (error) {
        try {
          captureException(error);
        } catch (error) {}
        return {
          code: 456,
          message: `未知的异常\n${errorFormatByNode(error)}`,
          data: {},
        };
      }
    },
  });

export const ChannelUse = (name: ChannelName, message: string) =>
  t.procedure.use(({ ctx, input, next }) => {
    const logService = ctx.injector.get(LogFactoryService).getLog(name);
    logService.createProgress(message);
    return next().finally(() => {
      logService.endProgress();
    });
  });
