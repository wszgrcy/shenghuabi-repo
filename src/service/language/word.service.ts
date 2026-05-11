import * as vscode from 'vscode';
import {
  Injector,
  RootStaticInjectOptions,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from 'static-injector';
import { FolderName, WorkspaceService } from '../workspace.service';

import chroma from 'chroma-js';
import { formatChat } from '../../share/util';
import { DagangData, FileService } from './file.service';
import { Hanyu } from './const';
import { pinyin } from 'pinyin-pro';
import { StatusService } from '../status.service';
import { ExtensionConfig } from '../config.service';

import { setMindRelationLabel } from '../../util/mind-relation-label';
import { omitBy, uniqBy } from 'lodash-es';
import { debounce } from 'lodash-es';
import { Trie } from 'mnemonist';
import { contentFormat } from '../../util/content-format';
import { parse } from 'marked';
import { wrapALink } from '../../util/hover/wrap-link';
import {
  CardDataType,
  ChatMindNode,
  EditorDecorationTypeTransformDefine,
} from '../../share';
import { path } from '@cyia/vfs2';
import { DICT_PREFIX } from '../vector/const';
import * as v from 'valibot';
import { GraphInfoHintService } from '../knowledge/graph-info-hint.service';
import { CustomKnowledgeManagerService } from '../knowledge/custom-knowledge.manager.service';
import { DictKnowledgeService } from '@shenghuabi/knowledge/knowledge';
import { dynamicInject } from '../../token';
import { KnowledgeConfigService } from '../knowledge/knowledge-config.service';
type WordMetadata = Record<
  string,
  {
    list: vscode.MarkdownString[];
    type?: vscode.TextEditorDecorationType;
    /** 编辑器配置; */
    config?: CardDataType['editor'];
  }
>;

type RangeCache = {
  offset: readonly [number, number];
  value: string;
  range: vscode.Range;
};
export class WordService extends RootStaticInjectOptions {
  #workspace = inject(WorkspaceService);
  #injector = inject(Injector);
  #knowledgeManager$$ = dynamicInject(CustomKnowledgeManagerService);
  #knowledgeConfig = inject(KnowledgeConfigService);
  /** 重命名使用 */
  #rangeCacheMap = new Map<string, RangeCache[]>();
  #file = inject(FileService);
  #status = inject(StatusService);
  #graphHint = inject(GraphInfoHintService);
  #snippetList = computed(() => {
    return this.#hoverData().then(({ metaList }) => {
      let newList: vscode.CompletionItem[] = [];
      for (const item of metaList) {
        const completion = item.config?.completion;
        if (!completion?.enable) {
          continue;
        }
        const filterList = [item.title, ...(completion.value?.list || [])];
        if (completion.value?.pinyin) {
          filterList.push(
            pinyin(item.title, {
              toneType: 'none',
              removeNonZh: true,
              type: 'array',
              v: true,
            }).join(''),
          );
        }
        newList = newList.concat(this.#createCompletionList(item, filterList));
      }
      return newList;
    });
  });
  #graphSnippetList = computed(() =>
    this.#graphHint.completionList$$().flatMap((graph) => {
      return graph.list.flatMap((node) => {
        return this.#createCompletionList(
          {
            title: node.name,
            description: node.description,
            config: undefined,
          },
          [
            node.name,
            ...(graph.completion?.value?.pinyin
              ? [
                  pinyin(node.name, {
                    toneType: 'none',
                    removeNonZh: true,
                    type: 'array',
                    v: true,
                  }).join(''),
                ]
              : []),
          ],
        );
      });
    }),
  );
  #createCompletionList(
    item: {
      title: string;
      description: vscode.MarkdownString;
      config: any;
    },
    /** 同一项多个补全 */
    list: string[],
  ) {
    return list.map((filterText) => {
      const cItem = new vscode.CompletionItem(item.title);
      cItem.documentation = item.description;
      cItem.insertText = item.title;
      cItem.detail = '';
      cItem.filterText = filterText;
      return cItem;
    });
  }
  /** 默认主题,用于重置css */
  #hoverContentStyleLinkTag$ = computed(() => {
    const cssPath = this.#workspace.formatPath(
      `{{extensionFolder}}/data/style/hover-content.css`,
    );
    return `<link rel="stylesheet" href="${path.normalize(cssPath)}">`;
  });
  /** 入口 */
  async init() {
    const editor$ = signal(vscode.window.activeTextEditor);
    /** 变更统计触发 */
    const documentChange$$ = signal(0);
    const documentChange$ = signal(0);
    const cardHighlight = debounce(
      () =>
        untracked(() => {
          if (ExtensionConfig['mind.editor.highlight'].enable() && editor$()) {
            this.#setCardHighLight(editor$()!);
          }
        }),
      100,
    );
    const graphHighLight = debounce(
      () =>
        untracked(() => {
          if (editor$()) {
            this.#setGraphHighLight(editor$()!);
          }
        }),
      100,
    );
    effect(
      () => {
        /** 编辑器/文件/变更索引其中一个变化就更新 */
        const editor = editor$();
        this.#file.dagangSignal();
        documentChange$$();
        if (
          editor &&
          editor.document.uri.scheme === 'file' &&
          editor.document.languageId === 'wenzhang'
        ) {
          this.#status.wordChange(editor.document.getText().length);
          documentChange$.update((a) => a + 1);
          cardHighlight();
          graphHighLight();
        } else {
          this.#status.wordBar.hide();
        }
      },
      { injector: this.#injector },
    );
    effect(
      () => {
        const list = this.#graphHint.editorList$$();
        documentChange$();
        if (list && list.length) {
          graphHighLight();
        }
      },
      { injector: this.#injector },
    );
    // 这里是文本编辑器。不是通用编辑器
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      editor$.set(editor);
    });

    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (editor$() && event.document === editor$()!.document) {
        documentChange$$.update((i) => i + 1);
      }
    });
    this.#renameListener();
    // 进行一个强制触发：“”
    vscode.languages.registerCompletionItemProvider(
      Hanyu,
      {
        provideCompletionItems: () => [],
      },
      '：',
    );
    // 准备在json中加代码片段,卡片中的
    vscode.languages.registerCompletionItemProvider(Hanyu, {
      provideCompletionItems: () => {
        return Promise.all([
          this.#snippetList(),
          this.#graphSnippetList(),
        ]).then((list) => list.flat());
      },
    });
    // 空格文档格式化
    const emptyReg = /^(\s+)?/;
    vscode.languages.registerDocumentFormattingEditProvider(Hanyu, {
      provideDocumentFormattingEdits: async (document, options, token) => {
        const emptyPrefix = '　'.repeat(
          ExtensionConfig['editor.text-indent'](),
        );
        const list = [];
        for (let i = 0; i < document.lineCount; i++) {
          const lineStr = document.lineAt(i).text;
          const result = lineStr.match(emptyReg);
          const start = new vscode.Position(i, 0);
          list.push(
            new vscode.TextEdit(
              new vscode.Range(
                start,
                new vscode.Position(i, result![0].length),
              ),
              emptyPrefix,
            ),
          );
        }
        return list;
      },
    });
    vscode.languages.setLanguageConfiguration(Hanyu, {
      onEnterRules: [
        {
          beforeText: /.*/,
          action: {
            indentAction: vscode.IndentAction.None,
            appendText: '　'.repeat(ExtensionConfig['editor.text-indent']()),
          },
        },
      ],
    });
    // 空文件初始化缩进
    vscode.workspace.onDidOpenTextDocument((e) => {
      if (
        e.uri.scheme !== 'file' ||
        e.languageId !== 'wenzhang' ||
        e.getText().length
      ) {
        return;
      }
      this.#workspace.vfs.write(
        e.uri.fsPath,
        '　'.repeat(ExtensionConfig['editor.text-indent']()),
      );
    });
    vscode.languages.registerHoverProvider(Hanyu, {
      provideHover: async (document, position, token) => {
        const editor = editor$();
        if (editor?.document !== document) {
          return null;
        }
        if (editor.selection.start.isEqual(editor.selection.end)) {
          return null;
        }
        if (!editor.selection.contains(position)) {
          return null;
        }
        const text = document.getText(editor.selection).trim();
        if (!text) {
          return null;
        }
        if (!ExtensionConfig['dict.editor.selectHover'].enable()) {
          return null;
        }
        const result = await this.#search(text);
        return new vscode.Hover(result);
      },
    });
  }
  #trie$ = computed(() => {
    return this.#hoverData().then(({ wordList }) => Trie.from(wordList));
  });
  #wordMatchReg$ = computed(() => {
    const sort = ExtensionConfig['mind.editor.highlight'].sort();
    return this.#hoverData().then(({ wordList }) => {
      return this.#wordMatchReg(
        [...wordList].sort((a, b) => {
          return sort.startsWith('long')
            ? b.length - a.length
            : a.length - b.length;
        }),
      );
    });
  });
  #matchWord(
    document: vscode.TextDocument,
    trie: Trie<string>,
    regexp: RegExp,
    options: {
      sort: string;
    },
  ) {
    const obj: Record<
      string,
      {
        position: vscode.Range[];
      }
    > = {};
    const text = document.getText();
    regexp.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regexp.exec(text))) {
      const currentIndex = regexp.lastIndex;
      const matchWord = match[0];
      const offsetList =
        options.sort.endsWith('Only') || options.sort === `longFirst`
          ? [matchWord]
          : trie
              .find(matchWord)
              .filter((item) =>
                text.startsWith(item.slice(matchWord.length), currentIndex),
              );
      const startPos = document.positionAt(match.index);
      for (const word of offsetList) {
        // 位置转换。高亮
        const endPos = document.positionAt(match.index + word.length);
        const range = new vscode.Range(startPos, endPos);
        obj[word] ??= { position: [] };
        obj[word].position.push(range);
      }
      // [和(平]等)
      regexp.lastIndex = currentIndex - matchWord.length + 1;
    }
    return obj;
  }
  /** 高亮 */
  async #setCardHighLight(editor: vscode.TextEditor) {
    const document = editor.document;
    let obj: Record<
      string,
      {
        position: vscode.Range[];
      }
    > = {};
    return Promise.all([this.#hoverData()]).then(
      async ([{ decorationList, wordList }]) => {
        /** 高亮用 */
        const data = decorationList;
        /** 一些原始数据 */
        /** 获取所有选中的文本列表 */
        /** 纯title */
        const sort = ExtensionConfig['mind.editor.highlight'].sort();
        if (wordList.size) {
          const trie = await this.#trie$();
          const regexp = await this.#wordMatchReg$();
          obj = this.#matchWord(document, trie, regexp, { sort: sort });
        }
        // 每次文本变更时都会清空之前的样式
        for (const item of data) {
          const posData = obj[item.name];
          editor.setDecorations(
            item.type,
            (posData?.position || []).map((range) => {
              return { range, hoverMessage: item.list };
            }),
          );
        }
      },
    );
  }
  #typeCache: vscode.TextEditorDecorationType[] = [];

  #graphHighLight = computed(() => {
    this.#typeCache.forEach((item) => {
      item.dispose();
    });
    this.#typeCache = [];
    return this.#graphHint.highlightList$$().map((graph) => {
      const wordList = graph.list.map((item) => item.name);
      if (!wordList.length) {
        return;
      }
      const trie = Trie.from(wordList.slice());
      const regexp = this.#wordMatchReg(
        wordList.sort((a, b) => {
          return graph.highlight?.value!.sort.startsWith('long')
            ? b.length - a.length
            : a.length - b.length;
        }),
      );
      const decorationType = vscode.window.createTextEditorDecorationType({
        ...graph.highlight!.value?.style,
      });
      this.#typeCache.push(decorationType);
      return { ...graph, trie, regexp, decorationType };
    });
  });
  #setGraphHighLight(editor: vscode.TextEditor) {
    const document = editor.document;
    const list = this.#graphHighLight();
    for (const graph of list) {
      if (!graph) {
        continue;
      }
      const obj = this.#matchWord(document, graph.trie, graph.regexp, {
        sort: graph.highlight!.value!.sort,
      });

      if (graph.list.length) {
        editor.setDecorations(
          graph.decorationType,
          graph.list.flatMap(({ name, description }) => {
            return (obj[name]?.position || []).map((range) => {
              return { range, hoverMessage: description };
            });
          }),
        );
      } else {
        editor.setDecorations(graph.decorationType, []);
      }
    }
  }
  #colorScale = chroma.scale(['red', 'green', 'blue']);
  #lastDecorationList: {
    name: string;
    type: vscode.TextEditorDecorationType;
    list: vscode.MarkdownString[];
  }[] = [];
  /** 统计数据,数据的预处理
   * hover高亮+显示内容
   */
  #hoverData = computed(() => {
    // 每次清除上一次渲染
    this.#lastDecorationList.forEach((item) => {
      item.type.dispose();
    });
    this.#lastDecorationList = [];
    const wordMetadata: WordMetadata = {};
    const wordList = new Set<string>();
    const dataList = this.#file.dagangSignal();
    const metaList: {
      title: string;
      description: vscode.MarkdownString;
      config: any;
    }[] = [];
    return (async () => {
      for (const fileData of dataList) {
        for (const item of fileData.children) {
          if (item.type !== 'card' && item.type !== 'chat') {
            continue;
          }
          if (!item.data?.title || !item.data.editor?.decorationRender) {
            continue;
          }
          let description;
          if (item.type === 'card') {
            if (
              item.data?.value?.html ||
              typeof item.data?.value?.html === 'string'
            ) {
              const rel = this.#mdToHtml(fileData, item);
              const defaultStyle = this.#hoverContentStyleLinkTag$();
              const content = await contentFormat(
                defaultStyle + item.data.value.html + '\n' + rel,
                fileData.filePath,
                this.#injector,
                undefined,
                fileData.filePath,
                'hover',
              );
              const md = new vscode.MarkdownString(content);
              md.supportHtml = true;
              md.isTrusted = true;
              (md as any).isCustomHtml = true;
              description = md;
            } else {
              continue;
            }
          } else if (item.type === 'chat') {
            const data = formatChat(item.data.value);
            if (!data) {
              continue;
            }
            description = this.#format(data, fileData, item);
          } else {
            throw new Error('');
          }
          wordMetadata[item.data.title] ??= {
            list: [],
            config: item.data.editor,
          };
          wordMetadata[item.data.title].list.push(description);
          wordList.add(item.data.title);
          metaList.push({
            title: item.data.title,
            description: description,
            config: item.data.editor,
          });
        }
      }
      /** 总共多少词条.不重复的那种 */
      const dataLength = Object.keys(wordMetadata).length;
      const decorationList = [];
      for (let index = 0; index < dataLength; index++) {
        const title = Object.keys(wordMetadata)[index];
        const decorationRender = wordMetadata[title].config?.decorationRender
          ?.enable
          ? wordMetadata[title].config?.decorationRender.value
          : undefined;
        decorationList.push({
          name: title,
          type: vscode.window.createTextEditorDecorationType(
            v.parse(EditorDecorationTypeTransformDefine, {
              color: this.#colorScale(index / dataLength).hex(),
              ...omitBy(decorationRender, (item) => item == undefined),
            }),
          ),
          list: wordMetadata[title].list,
        });
      }

      this.#lastDecorationList = decorationList;
      return {
        /** 高亮使用 */ decorationList,
        wordList,
        wordMetadata,
        metaList,
      };
    })();
  });

  #format(
    text: string,
    dagangData: DagangData,
    data: DagangData['children'][number],
  ) {
    const refResult = this.#parserRelation(dagangData, data);
    const markdown = new vscode.MarkdownString((text || '') + '\n' + refResult);
    markdown.isTrusted = true;
    markdown.supportHtml = true;
    return markdown;
  }
  #parserRelation(
    dagangData: DagangData,
    data: DagangData['children'][number],
  ) {
    const filePath = dagangData.filePath;

    const refResult = {
      self: {
        url: `${filePath}`,
        label: `查看详细`,
        nodeId: data.id,
      },
      rel1: data.relation?.output.map((item) => {
        return {
          label: setMindRelationLabel(
            item.edge.label,
            (item.node as ChatMindNode).data.title,
          ),
          url: `${filePath}`,
          nodeId: item.node.id,
        };
      }),
      rel2: data.relation?.input.map((item) => {
        return {
          label: setMindRelationLabel(
            item.edge.label,
            (item.node as ChatMindNode).data.title,
          ),
          url: `${filePath}`,
          nodeId: item.node.id,
        };
      }),
    };
    const refTextList = [
      `\n---\n`,
      wrapALink(refResult.self.label, [
        'mind.focus-node',
        [refResult.self.url, refResult.self.nodeId],
      ]),
      `#### 引用`,
      refResult.rel1
        ?.map((item) => {
          return `- ${wrapALink(item.label, [
            'mind.focus-node',
            [item.url, item.nodeId],
          ])}`;
        })
        .join('\n') || '',
      `#### 被引用`,
      refResult.rel2
        ?.map((item) => {
          return `- ${wrapALink(item.label, [
            'mind.focus-node',
            [item.url, item.nodeId],
          ])}`;
        })
        .join('\n') || '',
    ];
    return refTextList.join('\n');
  }

  #mdToHtml(dagangData: DagangData, data: DagangData['children'][number]) {
    const refResult = this.#parserRelation(dagangData, data);
    return parse(refResult, { async: false });
  }
  /** 这个只是一个文件内的重命名,感觉没太大用途 */
  #renameListener() {
    // 暂时去掉.因为没太大用途
    // let value: string;
    // vscode.languages.registerRenameProvider(Hanyu, {
    //   provideRenameEdits: async (document, position, newName, token) => {
    //     // todo 。应该是全上下文搜索
    //     const text = document.getText();
    //     const list = this.searchByRegexp(text, new RegExp(value, 'ig'));
    //     const workspaceEdit = new vscode.WorkspaceEdit();
    //     for (const item of list) {
    //       workspaceEdit.replace(
    //         document.uri,
    //         new vscode.Range(
    //           document!.positionAt(item.position[0]),
    //           document!.positionAt(item.position[1]),
    //         ),
    //         newName,
    //       );
    //     }
    //     return workspaceEdit;
    //   },
    //   prepareRename: async (document, position, token) => {
    //     // 根据词位置。确定词
    //     const list = this.#rangeCacheMap.get(document.uri.toString());
    //     if (!list) {
    //       throw new Error(`无法重命名。您可以在脑图中添加并设置重命名。`);
    //     }
    //     const data = this.#findRange(document, list, position);
    //     if (data) {
    //       value = data.value;
    //       return { range: data.range, placeholder: data.value };
    //     }
    //     throw new Error(`无法重命名。您可以在脑图中添加并设置重命名。`);
    //   },
    // });
  }
  #findRange(
    document: vscode.TextDocument,
    list: RangeCache[],
    position: vscode.Position,
  ) {
    const offset = document.offsetAt(position);
    for (const item of list) {
      if (offset >= item.offset[0] && offset < item.offset[1]) {
        return item;
      }
    }
    return undefined;
  }
  #searchByRegexp(text: string, regexp: RegExp) {
    let match: RegExpExecArray | null;
    const list = [];
    while ((match = regexp.exec(text))) {
      list.push({
        value: match[0],
        position: [match.index, match.index + match[0].length] as [
          number,
          number,
        ],
      });
    }
    return list;
  }
  #wordMatchReg(wordList: string[]) {
    // todo 进行词匹配?长短词
    wordList = wordList.map((item) => item.trim()).filter(Boolean);
    if (!wordList.length) {
      throw new Error('词列表异常');
    }
    let regexpStr = `(`;
    regexpStr += wordList.map((item) => item).join('|');
    regexpStr += `)`;
    return new RegExp(regexpStr, 'igmd');
  }

  async #search(text: string) {
    const list = this.#knowledgeConfig
      .originConfigList$()
      .filter((item) => item.type === 'dict');
    const dictList = ExtensionConfig['dict.editor.selectHover'].list();
    const queryDictList = (
      dictList
        ? dictList
            .map((key) => {
              const item = list.find((_item) => _item.name === key);
              return item!;
            })
            .filter(Boolean)
        : list
    )?.map((item) => item.name);
    const contentList = [];
    const knowledgeRoot = this.#workspace.dir[FolderName.knowledgeDir]();
    const data = ExtensionConfig['dict.editor.selectHover']();
    for (const item of queryDictList) {
      const points = await this.#queryItem(item, text, data);
      if (!points.length) {
        continue;
      }
      for (const point of points) {
        const content = await contentFormat(
          (point.payload!['htmlContent'] ??
            point.payload!['content']) as string,
          // 字典资源文件夹
          path.join(knowledgeRoot, item, 'assets'),
          this.#injector,
          //字典名
          item.slice(DICT_PREFIX.length),
          undefined,
          'hover',
        );
        const md = new vscode.MarkdownString(
          `<p style="margin: 0.5rem 0 0.5rem 0;font-weight: bold">${point.payload!['word']}</p>` +
            content,
        );
        md.supportHtml = true;
        md.isTrusted = true;
        (md as any).isCustomHtml = true;
        contentList.push(md);
      }
    }
    return contentList;
  }
  async #queryItem(
    name: string,
    text: string,
    options: { limit: number; score: number },
  ) {
    let list;
    const instance = (await this.#knowledgeManager$$().get(
      name,
    )) as DictKnowledgeService;
    if (options.score < 1) {
      list = await instance.searchWord(text, {
        limit: options.limit,
        score: options.score,
      });
    } else {
      ({ points: list } = await instance.matchWord(text, {
        limit: options.limit,
      }));
    }
    return uniqBy(list, (item) => item.payload!['word']);
  }
}
