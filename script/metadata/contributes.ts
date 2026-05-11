import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CommandPrefix } from './const';

type MenuType = Record<
  | 'editor/title'
  | 'editor/context'
  | 'explorer/context'
  | 'view/title'
  | 'view/item/context'
  | 'webview/context'
  | 'commandPalette',
  {
    when: string;
    group?: string;
    alt?: string;
  }
>;
export interface Config {
  command: string;
  title?: string;
  i18n?: {};
  icon?: string;
  shortTitle?: string;
  category?: string;
  display?: {
    menus: Partial<MenuType>;
  };
}
async function main() {
  const DATA: Config[] = [
    // todo 去掉排版，因为暂时没用
    {
      command: `help`,
      title: '帮助(bangzhu)',
      i18n: {},
      icon: '$(question)',
      category: '生花笔',
      display: {
        menus: {
          commandPalette: { when: 'true' },
        },
      },
    },
    // {
    //   command: `layout`,
    //   title: '排版',
    //   i18n: {},
    //   icon: '$(explorer-view-icon)',
    //   display: {
    //     menus: {
    //       'editor/title': {
    //         when: '!isInDiffEditor && resourceScheme == file',
    //         group: 'navigation',
    //       },
    //     },
    //   },
    // },
    {
      command: `syncArticle`,
      title: '同步文章',
    },
    { command: `call-ai-chat-sidebar`, title: '调用ai对话(侧边栏)' },
    { command: `call-ai-chat-editor`, title: '调用ai对话(编辑器)' },
    {
      command: `chatTemplateSync`,
      title: '同步内置模板',
      icon: '$(sync)',
      display: {
        menus: {
          'view/title': {
            group: 'navigation@1',
            when: 'view == shenghuabi.chat.tree',
          },
        },
      },
    },
    {
      command: `promptTemplateSave`,
      title: '提示词模板保存',
      icon: '$(check)',
      display: {
        menus: {
          'view/title': {
            group: 'navigation@2',
            when: 'view == shenghuabi.aiChat',
          },
        },
      },
    },

    {
      command: `workflowSync`,
      title: '同步内置工作流',
      icon: '$(sync)',
      display: {
        menus: {
          'view/title': {
            group: 'navigation@1',
            when: 'view == shenghuabi.workflow.tree',
          },
        },
      },
    },
    // 没啥用，
    // {
    //   command: `chatReset`,
    //   title: '对话重置',
    //   icon: '$(redo)',
    //   display: {
    //     menus: {
    //       'view/title': {
    //         group: 'navigation@1',
    //         when: 'view == shenghuabi.aiChat',
    //       },
    //     },
    //   },
    // },
    {
      command: 'chat.tree.item.delete',
      title: '删除模板',
      icon: '$(trash)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.chat.tree && viewItem == prompt',
            group: 'inline',
          },
        },
      },
    },
    {
      command: 'chat.tree.item.edit',
      title: '编辑模板',
      icon: '$(edit)',
      // display: {
      //   menus: {
      //     'view/item/context': {
      //       when: 'view == shenghuabi.chat.tree && viewItem == prompt',
      //       group: 'inline',
      //     },
      //   },
      // },
    },
    {
      command: 'chat.tree.item.add',
      title: '新增模板',
      icon: '$(add)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.chat.tree && viewItem == codeActionList',
            group: 'inline',
          },
        },
      },
    },
    // webview用或者
    // {
    //   command: 'knowledge.add.default',
    //   title: '新增知识库(使用默认参数)',
    //   icon: '$(add)',
    //   display: {
    //     menus: {
    //       'view/title': {
    //         when: 'view == shenghuabi.knowledge.tree',
    //         // group: 'inline',
    //         group: 'navigation@1',
    //       },

    //     },
    //   },
    // },
    {
      command: 'knowledge.delete',
      title: '删除知识库',
      icon: '$(trash)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.knowledge.tree && viewItem == knowledgeDirContextValue',
            // group: 'inline',
          },
        },
      },
    },
    {
      command: 'knowledge.copyName',
      title: '复制名字',
      icon: '$(chrome-restore)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.knowledge.tree && viewItem == knowledgeDirContextValue',
            group: 'inline@2',
          },
        },
      },
    },
    {
      command: 'knowledge.tree.item.add',
      title: '新增知识库内容',
      icon: '$(add)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.knowledge.tree && viewItem == knowledgeDirContextValue',
            group: 'inline@3',
          },
        },
      },
    },
    {
      command: 'knowledge.tree.item.configEdit',
      title: '编辑配置',
      icon: '$(gear)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.knowledge.tree && viewItem == knowledgeDirContextValue',
            group: 'inline@4',
          },
        },
      },
    },
    {
      command: 'knowledge.tree.item.export',
      title: '导出',
      icon: '$(export)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.knowledge.tree && viewItem == knowledgeDirContextValue',
            group: 'inline@1',
          },
        },
      },
    },
    {
      command: 'knowledge.tree.openFolder',
      title: '打开文件夹',
      icon: '$(folder)',
      display: {
        menus: {
          'view/title': {
            when: 'view == shenghuabi.knowledge.tree ',
            group: 'navigation@1',
          },
        },
      },
    },
    {
      command: 'knowledge.tree.import',
      title: '导入',
      icon: '$(plus)',
      display: {
        menus: {
          'view/title': {
            when: 'view == shenghuabi.knowledge.tree ',
            group: 'navigation@2',
          },
        },
      },
    },

    {
      command: 'knowledge.tree.item.edit',
      title: '编辑知识库内容',
      icon: '$(edit)',
    },
    {
      command: 'knowledge.tree.item.delete',
      title: '删除知识库内容',
      icon: '$(trash)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.knowledge.tree && viewItem == knowledgeFileContextValue',
            group: 'inline',
          },
        },
      },
    },
    {
      command: 'open-environment-configuration',
      title: '环境配置',
    },
    {
      command: 'workflow.tree.file.copy',
      title: '复制',
      icon: '$(files)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.workflow.tree && viewItem == workflow.tree.file',
            group: 'inline@1',
          },
        },
      },
    },
    {
      command: 'workflow.tree.file.rename',
      title: '重命名',
      icon: '$(whole-word)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.workflow.tree && viewItem == workflow.tree.file',
            group: 'inline@2',
          },
        },
      },
    },
    {
      command: 'workflow.tree.file.delete',
      title: '删除',
      icon: '$(trash)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.workflow.tree && viewItem == workflow.tree.file',
            group: 'inline@3',
          },
        },
      },
    },
    {
      command: 'workflow.tree.file.add',
      title: '新增',
      icon: '$(add)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.workflow.tree && viewItem == workflow.tree.folder',
            group: 'inline',
          },
          'view/title': {
            group: 'navigation@1',
            when: 'view == shenghuabi.workflow.tree',
          },
        },
      },
    },
    {
      command: 'workflow.tree.folder.open',
      title: '打开文件夹',
      icon: '$(folder)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.workflow.tree && viewItem == workflow.tree.folder',
            group: 'inline',
          },
          'view/title': {
            group: 'navigation@2',
            when: 'view == shenghuabi.workflow.tree',
          },
        },
      },
    },
    {
      command: 'workflow.tree.file.edit',
      title: '编辑',
      icon: '$(edit)',
    },

    {
      command: 'editor.sentence.change',
      title: '逐行对话',
      icon: '$(selection)',
      display: {
        menus: {
          'editor/title': {
            group: 'navigation@2',
            when: '!isInDiffEditor && !activeEditorIsDirty && resourceScheme == file && activeEditor ==  workbench.editors.files.textFileEditor',
            alt: 'editor.sentence.re-change',
          },
        },
      },
    },

    {
      command: 'editor.sentence.re-change',
      title: '[逐行]重新选择工作流',
      icon: '$(gear)',
    },
    {
      command: 'editor.fullText.change',
      title: '全文对话',
      icon: '$(output)',
      display: {
        menus: {
          'editor/title': {
            group: 'navigation@2',
            when: '!isInDiffEditor && !activeEditorIsDirty && resourceScheme == file && activeEditor ==  workbench.editors.files.textFileEditor',
            alt: 'editor.fullText.re-change',
          },
        },
      },
    },
    {
      command: 'editor.fullText.re-change',
      title: '[全文]重新选择工作流',
      icon: '$(gear)',
    },
    {
      command: 'editor.diff.saveAs',
      title: '修改内容创建为新文件',
      icon: '$(save-as)',
      display: {
        menus: {
          'editor/title': {
            group: 'navigation@1',
            when: 'isInDiffEditor  ',
          },
        },
      },
    },

    {
      command: 'external.document-convert',
      title: '文档转换',
      display: {
        menus: {
          'explorer/context': {
            when: ['pptx', 'odt', 'odp', 'ods', 'pdf', 'docx', 'epub', 'xlsx']
              .map((item) => `resourceExtname == '.${item}'`)
              .join('||'),
            group: 'convert',
          },
        },
      },
    },
    {
      command: 'external.image-convert',
      title: '图像识别',
      display: {
        menus: {
          'explorer/context': {
            when: [
              'jpg',
              'jp2',
              'jpe',
              'jpeg',
              'jfif',
              'png',
              'webp',
              'bmp',
              'tif',
              'tiff',
              'avif',
              'heic',
              'heif',
            ]
              .map((item) => `resourceExtname == '.${item}'`)
              .join('||'),
            group: 'convert',
          },
        },
      },
    },
    {
      command: 'knowledge-query.open-dict-item',
      title: '打开字典项',
    },
    {
      command: 'knowledge-query.open-dict-item-anchor',
      title: '打开字典项(跳转)',
    },
    {
      command: 'knowledge-query.search',
      title: '知识库搜索',
    },
    {
      command: 'knowledge-query.replace',
      title: '替换到编辑器',
      icon: '$(replace)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.knowledge-query.result-tree && viewItem == knowledgeQueryReplaceContextValue',
            group: 'inline',
          },
        },
      },
    },
    {
      command: 'mind.tree.file.delete',
      title: '删除',
      icon: '$(replace)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.shenghuabi.mind.tree && viewItem == mindTreeFileContextValue',
          },
        },
      },
    },

    {
      command: 'showChannel',
      title: '打开输出',
    },
    {
      command: 'mind.focus-node',
      title: '脑图节点跳转',
    },
    { command: 'mind.theme.create', title: '创建主题' },
    { command: 'knowledge.graph.open', title: '打开知识库图谱' },
    { command: 'knowledge.stopImport', title: '停止导入' },
    { command: `external.call`, title: '外部调用命令' },
    { command: `completion.select`, title: '补全选择' },
    { command: `correction.updateItem`, title: '应用纠错' },
    {
      command: `correction.clear`,
      title: '清除修改提示',
      icon: '$(clear-all)',
      display: {
        menus: {
          'editor/title': {
            group: 'navigation@3',
            when: '!isInDiffEditor && !activeEditorIsDirty && resourceScheme == file && activeEditor ==  workbench.editors.files.textFileEditor',
          },
        },
      },
    },
    {
      command: `chat.history.openFolder`,
      title: '打开文件夹',
      icon: '$(folder)',
      display: {
        menus: {
          'view/title': {
            group: 'navigation@1',
            when: 'view == shenghuabi.chat.history',
          },
        },
      },
    },
    {
      command: `chat.history.use`,
      title: '使用此对话历史',
      icon: '$(debug-start)',
      display: {
        menus: {
          'view/item/context': {
            when: 'view == shenghuabi.chat.history && viewItem == prompt',
          },
        },
      },
    },
    {
      command: `tts.editor`,
      title: '文本到语音处理',
      icon: '$(record)',
      display: {
        menus: {
          'editor/title': {
            group: 'navigation@4',
            when: '!isInDiffEditor && resourceScheme == file && activeEditor ==  workbench.editors.files.textFileEditor',
            alt: 'tts.editor.force',
          },
        },
      },
    },
    {
      command: `tts.editor.force`,
      title: '文本到语音处理(重新配置)',
      icon: '$(record)',
    },

    // {
    //   command: `chat.history.item.delete`,
    //   title: '删除',
    //   icon: '$(trash)',
    //   display: {
    //     menus: {
    //       'view/item/context': {
    //         when: 'view == shenghuabi.chat.history && viewItem == prompt',
    //       },
    //     },
    //   },
    // },
  ];
  const filePath = join(process.cwd(), 'data', 'package.json');
  const str = readFileSync(filePath, {
    encoding: 'utf-8',
  });
  const data = JSON.parse(str);
  data['contributes']['commands'] = DATA.map((item) => {
    return {
      command: `${CommandPrefix}.${item.command}`,
      title: item.title,
      icon: item.icon,
      shortTitle: item.shortTitle,
      category: item.category,
    };
  });

  data['contributes']['menus'] = {};
  for (const item of DATA) {
    for (const key in item.display?.menus) {
      const element = (item.display?.menus as any)?.[key];
      data['contributes']['menus'][key] ??= [];
      data['contributes']['menus'][key].push({
        command: `${CommandPrefix}.${item.command}`,
        group: element?.group,
        when: element?.when || undefined,
        alt: element?.alt ? `${CommandPrefix}.${element?.alt}` : undefined,
      });
    }
    if (!item.display?.menus?.commandPalette) {
      data['contributes']['menus']['commandPalette'] ??= [];
      data['contributes']['menus']['commandPalette'].push({
        command: `${CommandPrefix}.${item.command}`,
        when: 'false',
      });
    }
  }

  data['contributes']['configuration'] = await getConfig();
  writeFileSync(filePath, JSON.stringify(data, undefined, 2));
}

async function getConfig() {
  let { CONFIG } = await import('./config');
  let { valibotToVscodeConfig } = await import('@cyia/vscode-valibot-config/valibot-to-vscode-config');
  return valibotToVscodeConfig(CONFIG, { title: '软件配置', prefix: 'shenghuabi' });
}
main();
