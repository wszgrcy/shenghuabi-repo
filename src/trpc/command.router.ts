import * as v from 'valibot';
import { t } from './t';
import { observable } from '@trpc/server/observable';
import { CommandListen$ } from '../service/command.listen';
import * as vscode from 'vscode';
import { WorkspaceService } from '../service/workspace.service';
import { ExtensionConfig } from '../service/config.service';

export const CommandRouter = t.router({
  listen: t.procedure.input(v.string()).subscription(async ({ input, ctx }) => {
    return observable<any[]>((emit) => {
      const ref = CommandListen$.subscribe((value) => {
        if (value && input === value.command) {
          emit.next(value.arguments);
        }
      });
      return () => {
        ref.unsubscribe();
      };
    });
  }),
  exec: t.procedure
    .input(
      v.object({ command: v.string(), options: v.optional(v.array(v.any())) }),
    )
    .query(async ({ input, ctx }) => {
      await vscode.commands.executeCommand(
        input.command,
        ...(input.options || []),
      );
    }),
  check: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    if (input === 'workspace') {
      const workspace = ctx.injector.get(WorkspaceService);
      return !!workspace.nFolder();
    } else if (input === 'configuration') {
      return !!ExtensionConfig.defaultDir();
    } else {
      return false;
    }
  }),
});
