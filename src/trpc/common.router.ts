import * as v from 'valibot';
import { t } from './t';
import * as vscode from 'vscode';
import { ExtensionConfig } from '../service/config.service';
const SITE = `bbs.shenghuabi.site`;

const configEnum = v.picklist(['knowledgeGraph.view']);
export const CommonRouter = t.router({
  error: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    vscode.window.showErrorMessage(input);
  }),
  warn: t.procedure.input(v.any()).query(async ({ input, ctx }) => {
    vscode.window.showWarningMessage(input);
  }),
  getConfig: t.procedure.input(configEnum).query(async ({ input, ctx }) => {
    return ExtensionConfig[input]();
  }),
  helpSearch: t.procedure.input(v.string()).query(async ({ input, ctx }) => {
    const params = new URLSearchParams({
      q: `${input} @admin #editor-doc`,
    });
    const result2 = await fetch(`https://${SITE}/search.json?${params}`, {
      method: 'get',
    }).then(
      (res) =>
        res.json() as any as {
          topics?: { id: number; title: string }[];
          posts?: { topic_id: number; blurb: string }[];
        },
    );
    return (result2.topics ?? []).map((item) => {
      return {
        label: item.title,
        value: `https://${SITE}/t/topic/${item.id}`,
      };
    });
  }),
  // platform: t.procedure.input(z.any()).query(async ({ input, ctx }) => {
  //   return process.platform;
  // }),
});
