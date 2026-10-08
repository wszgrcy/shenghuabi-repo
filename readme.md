# 生花笔 (shenghuabi)

基于 VS Code 源码二次开发的 Windows / Linux 桌面写作与知识管理工具：脑图、知识库、RAG 检索、本地模型、工作流编排。

|        |                                                                 |
| ------ | --------------------------------------------------------------- |
| 基线   | VS Code `1.122.x`（`package.json` 版本 `1.122.xx`）             |
| 平台   | Windows x64 / Linux x64                                         |
| 运行时 | Electron（随 VS Code 构建） + Node 22                           |
| 下载   | [Releases](https://github.com/wszgrcy/shenghuabi-repo/releases) |

---

## 1. 总体结构

一个发行版 = **打过补丁的 VS Code 源码** + **一个内置扩展**，本仓库只包含后者以及驱动前者的构建脚本。

```
发行版（Electron 应用）
├─ VS Code 源码            lib/vscode（构建时从官方 tag 拉取，脚本打补丁，不入库）
└─ 内置扩展 shenghuabi     本仓库 src/ → dist/ → resources/app/extensions/shenghuabi
   ├─ 扩展宿主进程（Node）  服务层 / tRPC / 知识库 / 工作流 / 本地模型
   ├─ webview 渲染层        webview/main（Angular 21 + React 19 混合）
   └─ 子进程 / worker       embedding、rerank、OCR（onnxruntime-node）、llama.cpp
```

四条进程边界：

1. **Electron main**：源码里注册了自定义 `ShengHuabi` channel 与 `shb:` scheme，用于主进程文件读取桥接和 webview 资源策略。
2. **扩展宿主**：`src/index.ts` 激活，用 [static-injector](https://github.com/wszgrcy/static-injector)（Angular DI 的独立版本）搭根容器，所有服务靠 token 注入。
3. **webview**：Angular standalone 组件；脑图 / 手绘用 React 组件（`@xyflow/react`、`excalidraw`）通过 custom elements 挂载，两套渲染体系在同一页面共存。
4. **推理子进程**：`tinypool` worker 跑本地模型，与扩展宿主隔离；llama.cpp 由 llama-swap 以独立进程管理。

---

## 2. 目录说明

| 路径                                                   | 作用                                                                                                                                                                                                              |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/`                                                 | 扩展宿主代码（TypeScript，ESM，esbuild 打包）                                                                                                                                                                     |
| `src/index.ts`                                         | `activate()` 入口，注册服务、编辑器、视图、命令                                                                                                                                                                   |
| `src/token.ts`                                         | DI token 定义                                                                                                                                                                                                     |
| `src/trpc/`                                            | Extension ↔ Webview 通信（`@cyia/vscode-trpc`），按域拆 router：`ai` `chat` `knowledge` `mind` `workflow` `dict` `document` `fs` `configuration` `plugin` `tts` `request` `command` `assets` `id-asset` `common` |
| `src/service/`                                         | 业务服务层，见 §5                                                                                                                                                                                                 |
| `src/webview/`                                         | 自定义编辑器与视图的宿主端：`custom-editor/`（`mind-editor2` `rich-editor` `tts-editor` `workflow-editor`）、`custom-sidebar/`、`tree/`、`common-webview/`、`config/`、`webview.map.ts`                           |
| `src/share/`                                           | 宿主与 webview 共享的类型与协议（`chat` `mind` `rag` `workflow` `knowledge` `valibot` `define`）                                                                                                                  |
| `src/sdk/`                                             | 插件 SDK 源码（`shbPluginRegister` / `createConfig`），单独构建发布为 npm 包                                                                                                                                      |
| `src/declaration/code-node.ts`                         | 对外类型入口，`dts-bundle-generator` 产出 `dist/code-node.d.ts` 给插件用                                                                                                                                          |
| `src/export/`                                          | 供外部进程引用的入口（工作流 runner、插件 manifest 类型）                                                                                                                                                         |
| `src/native/` `src/class/` `src/platform/` `src/util/` | 原生能力封装、通用类（worker wrapper、flow-file）、平台适配、工具函数                                                                                                                                             |
| `webview/main/`                                        | Angular 21 应用（pnpm workspace 成员），见 §6                                                                                                                                                                     |
| `script/`                                              | 全部构建脚本（tsx 直接执行，无编译产物）                                                                                                                                                                          |
| `script/change-vscode/`                                | **VS Code 源码补丁清单**，见 §4                                                                                                                                                                                   |
| `script/metadata/contributes.ts`                       | `contributes` 的声明式来源，见 §9                                                                                                                                                                                 |
| `script/move-extension.ts`                             | 构建扩展并拷进 VS Code 产物目录                                                                                                                                                                                   |
| `script/build-common-package.ts`                       | 拉起的完整发行版构建流程                                                                                                                                                                                          |
| `language/`                                            | 自定义「文章」语言的 TextMate 语法、语言配置、代码片段                                                                                                                                                            |
| `data/`                                                | 构建期使用的二进制与模板（如 `7zr.exe`）                                                                                                                                                                          |
| `test/`                                                | 集成测试（`knowledge` `mind` `workflow` `config` `util` + `fixture/`）                                                                                                                                            |
| `doc/`                                                 | `vscode修改记录.md`（源码改造历史）、扩展文档                                                                                                                                                                     |
| `lib/vscode`                                           | **不入库**。官方 VS Code 源码 checkout，构建时生成                                                                                                                                                                |
| `lib/VSCode-<platform>-<arch>`                         | **不入库**。min 构建产物，扩展被拷进它的 `resources/app/extensions/shenghuabi`                                                                                                                                    |
| `.github/workflows/`                                   | `windows-builder.yml` `linux-builder.yml`                                                                                                                                                                         |

---

## 3. 环境与本地开发

```bash
# Node 22.22.1（见 .nvmrc）、pnpm 11.x、Python 3.11（native 模块编译）
# Windows 另需 Visual Studio 2022 + MSVC；Linux 需 gcc / make / dpkg-dev
pnpm i                       # workspace 包含 src 与 webview/main
pnpm run build:contributes   # 生成 package.json 的 contributes 段
pnpm run watch               # esbuild watch：扩展宿主 + 3 个 worker
cd webview/main && pnpm start # Angular watch
```

VS Code 里 **F5 → `Run Extension`**（`.vscode/launch.json` 已带 `--enable-proposed-api wszgrcy.shenghuabi`，`fixture/` 作为测试工作区）。
另有 `端口开发监听` 配置，attach 到 5870 调试宿主进程。

`dev.env` 里的 `PUBLISH_VERSION` 会被 define 进构建产物，作为运行期版本号。

> 只改扩展层不需要 VS Code 源码；只有要改源码行为（§4）时才需要 `lib/vscode`。

---

## 4. VS Code 源码改造（本仓库的核心机制）

**没有维护 fork 分支。** 每次构建从 `microsoft/vscode` 拉指定 tag，然后重放一份声明式补丁清单：

```ts
// script/change-vscode/index.ts
{
  path: 'src/vs/workbench/api/common/extHostLanguageModelTools.ts',
  list: [
    {
      query: `VariableDeclaration:has(>Identifier[value=dto])>ObjectLiteralExpression>SyntaxList::children(-1)`,
      replace: `,tags: definition.tags,`,
      description: '增加tag',
    },
  ],
}
```

- 执行器是 [`@code-recycle/cli`](https://github.com/wszgrcy/code-recycle)，`query` 是 CSS 选择器风格的 AST / token 查询（TS 文件走 TS AST，JSON 走 `jsonc-parser`），支持 `replace` / `insertBefore` / `insertAfter` / `delete` / `multi` / `offset`，`{{''|ctxValue}}` 可取原节点内容。
- 因为按语法结构定位而不是按行号打 patch，官方代码上下移动行不会失效，只有结构真变了才需要修。
- `build-common-package.ts` 的顺序：`git reset --hard <VSCODE_VERSION>` + `git clean -f` → 移除 Copilot 扩展 → `code-recycle` 打补丁 → 清理未使用 import → `git commit` → `npm i` → gulp 构建。
- 所以**升级 VS Code = 改一个 tag + 修少量失效 query**，不需要 rebase。

补丁按用途分类（`doc/vscode修改记录.md` 有逐条记录）：

| 类别                | 位置举例                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主进程通道 / scheme | `src/main.ts`（`shb:` scheme 与 privileges、首启生成 `languagepacks.json`）、`desktop.main.ts`（`ShengHuabi` channel 文件读取桥接）、`code/electron-main/app.ts`（`registerChannel`）                                        |
| 扩展宿主自定义 API  | `extHost.protocol.ts` / `extHost.api.impl.ts` / `extHost.common.services.ts` / 新增 `mainThreadShenghuabi.ts`，向 `vscode` 命名空间挂自定义接口                                                                              |
| 中文编辑行为        | `languageConfigurationRegistry.ts`（中文括号对自动配对）、`languagesAssociations.ts`（默认「文章」语言）、`monospaceLineBreaksComputer.ts`（中文缩进宽度）、`editorOptions.ts`（关闭 ambiguous / invisible characters 提示） |
| Markdown 渲染       | `markdownRenderer.ts` 支持 `isCustomHtml` + 自定义 `trustedTypes` policy + `shb` scheme 图片预请求；`extHostTypeConverters.ts` 透传该标记                                                                                    |
| Hover               | `contentHoverWidget.ts` 加 `ResizeObserver` 让 hover 随内容尺寸重算；`protocolMainService.ts` 允许 `.css`                                                                                                                    |
| Webview             | `webviewElement.ts` allowRules 增加 `keyboard-map` / `microphone`；`webviewMainService.ts` 给 iframe 实现 find-in-page                                                                                                       |
| 资源管理器          | `explorerViewer.ts` + `files.contribution.ts` + `files.ts` 新增「按数字顺序」排序                                                                                                                                            |
| Copilot 剥离        | `remove-copilot-extension.ts`、`build/npm/dirs.ts`、`gulpfile.vscode.ts`（`prepareCopilotRipgrepShimTask` 置空）、`package.json` 中 copilot watch 任务置空                                                                   |
| 品牌与本地化        | `change-vscode/update-product.ts` 写 `product.json`、默认 `zh-cn`、配置目录改 `.ShengHuaBi`、关闭账户入口与 workspace trust、公司名 / 版权                                                                                   |
| 构建链              | `gulpfile.vscode.ts` / `gulpfile.vscode.linux.ts` / `build/lib/electron.ts` / `build/linux/dependencies-generator.ts`（deb 命名、asar 排除 `.node`、依赖检查、max-old-space-size）                                           |

其中 `extHostLanguageModelTools.ts` 的 `tags` 透传修复已作为 PR 提交官方并随 1.126 发布，本地补丁与官方实现一致。

---

## 5. 扩展层服务（`src/service/`）

| 目录                                            | 职责                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ai/`                                           | Chat participant、提示词组装、`ai-text-search.provider.ts`（自定义搜索 provider）、`rag/`、`knowledge-base/`              |
| `knowledge/`                                    | 知识库管理、图谱（`graph/custom-graph.service.ts`）、配置                                                                 |
| `vector/` `vector-query/`                       | 向量入库与查询，qdrant 随应用内置启动（`@shenghuabi/knowledge/qdrant`）                                                   |
| `external-call/`                                | 本地推理入口：`embedding/`（transformers / OpenAI 两种实现）、`ranker/`、`ocr.service.ts`、`llama-swap-bridge.service.ts` |
| `file-parser/`                                  | 文档解析补充（图片走 OCR），基础解析在 `@shenghuabi/knowledge/file-parser`                                                |
| `mind/`                                         | 脑图数据、文件读写                                                                                                        |
| `worflow/`                                      | 工作流节点定义与预置（`define/` `preset/`），引擎在 `@shenghuabi/workflow`                                                |
| `plugin/`                                       | 插件发现、manifest 校验、DI 注入，见 §8                                                                                   |
| `server/`                                       | 对外 HTTP 接口，见 §10                                                                                                    |
| `language/`                                     | 拼音、数字归一、敏感词 diff、文本校正、文件服务                                                                           |
| `fs/` `vfs.ts`                                  | 文件监听、虚拟文件系统（`shb:` 与 Angular `virtualFs` 适配）                                                              |
| `llm.launcher.service.ts`                       | 本地 llama 进程随配置自启 / 停止                                                                                          |
| `script-editor/` `migrate/` `platform/` `util/` | 脚本编辑器 VFS、数据迁移、平台差异、工具                                                                                  |

自有子包以 npm 依赖形式引入：`@shenghuabi/knowledge`（qdrant、file-parser、worker）、`@shenghuabi/workflow`（引擎 + `NodeRunnerBase`）、`@shenghuabi/llama`、`@shenghuabi/python-addon`（TTS）、`@shenghuabi/openai`，源码在 `shb-knowledge` / `shb-lib` 仓库。

---

## 6. webview（`webview/main`）

Angular 21 standalone + Angular Material。

| 目录                                                             | 说明                                                                                            |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/app` `src/page`                                             | 路由与页面                                                                                      |
| `src/component` `src/component2`                                 | 组件（新旧两代并存）                                                                            |
| `src/react` `src/bridge`                                         | React 19 组件与互操作桥：`bridge/component-wrapper.ts` 把 React 组件包成 Angular custom element |
| `src/form` `src/piying`                                          | 表单（`@piying/view-angular`，schema 驱动）                                                     |
| `src/domain` `src/service` `src/pipe` `src/directive` `src/util` | 领域模型、服务、管道、指令、工具                                                                |
| `src/lazy-package`                                               | 懒加载分包                                                                                      |

构建：`pnpm --filter main-webview build`（`ng build`，脚本里已放宽堆内存），产物由主构建拷贝进 `dist/`。

---

## 7. 构建产物与打包细节

`script/build.ts`（`pnpm run build` / `watch`）用 esbuild 输出 ESM：

- 入口：`src/index.ts` + 三个 worker（`ocr` `text2vec` `reranker`，来自 `@shenghuabi/knowledge/worker`）
- `banner` 注入 `createRequire` shim，让 ESM 扩展能 `require` 原生模块
- `swc` 插件做转译，`importRequirePlugin` 处理 `vscode` 外部依赖
- `PROD_ENV` / `PUBLISH_VERSION` / `navigator` 等通过 `define` 内联

`pnpm run move:extension` 调用 `script/build-extension.ts`：并行执行扩展的 `build:prod` 与 webview 的 `ng build`，完成后删除 `dist/**/*.map` 与 `dist/node_modules/**/*.ts`（保留 `@types/node`）。Sentry sourcemap 上传逻辑保留在 `updateSourceMap()` 里、由 `--capture` 开关控制，目前注释未启用。

完整发行版：

```bash
# 1) 拉官方源码（CI 里 ref = VSCODE_VERSION）
git clone https://github.com/microsoft/vscode lib/vscode && git -C lib/vscode checkout 1.122.0

# 2) 打补丁 + min 构建（win32 走 build:common:win32，linux 走 build:linux）
pnpm run build:common-package

# 3) 构建扩展并拷进产物目录
pnpm run move:extension

# 4) 出安装包（这两个 gulp 任务由 script/change-vscode/index.ts 注入到 lib/vscode/package.json，官方没有）
cd lib/vscode
npm run build:user:win32-x64        # → .build/win32-x64/*.exe
npm run package:linux:deb           # → .build/linux-x64/*.deb
```

调试用：`pnpm run copytovscode` 把 `dist/` 拷进 `lib/vscode/extensions/shenghuabi`，配合从源码启动的 VS Code 使用。

---

## 8. 插件体系

插件就是普通 VS Code 扩展，通过 SDK 注册：

```ts
import { shbPluginRegister, createConfig } from '@shenghuabi/sdk';

export function activate(context: vscode.ExtensionContext) {
  shbPluginRegister(context, {
    providers: { root: [{ provide: SomeToken, useClass: MyImpl }] },
    workflow: { node: [{ client, runner, config }] },
    tts: {
      /* ... */
    },
  });
}
```

- manifest 用 valibot 定义并校验（`src/service/plugin/define.ts`）：`providers`（`root` / `knowledge` 两组 DI 覆盖，带 `priority`）、`workflow.node`（自定义节点：`client` 渲染 + `runner` 执行 + `config` 定义）、`workflow.context`、`tts`。
- 配置项用 `createConfig(valibotSchema, prefix)` 转 JSON Schema 写进插件 `package.json`，配置界面由表单方案自动渲染。
- 发布：`pnpm run build:plugin-sdk` / `pnpm run publish:plugin-sdk`。

---

## 9. `contributes` 的生成

`package.json` 的 `contributes` 段由 `script/metadata/contributes.ts` 生成（`pnpm run build:contributes`）：TS 里以数组声明 `command` / `title` / `icon` / `category` / `display.menus`，避免多人协作时手改大 JSON 冲突。菜单位置类型在 `MenuType` 里穷举（`editor/title`、`explorer/context`、`view/item/context` 等）。

---

## 10. 对外 HTTP 接口

`src/service/server/server.service.ts`：Fastify + `fastify-sse-v2`。

- `POST /workflow/stream`：body 由 valibot schema 转 JSON Schema 做校验，工作流输出以 SSE 流式返回，客户端断连即 `AbortController` 中止执行。
- 开关与端口在应用配置里，默认不启用。

---

## 11. 测试

```bash
pnpm test          # @vscode/test-cli，配置见 .vscode-test.mjs
pnpm run coverage  # c8，配置见 .c8rc.json
```

`.vscode-test.mjs` 指定下载 VS Code 版本、`--enable-proposed-api`、测试工作区 `test/fixture/workspace`，用例编译到 `test-dist/test/**/*.spec.js`。测试按 `knowledge` / `mind` / `workflow` / `config` / `util` 分目录。

---

## 12. CI 与发布

`.github/workflows/windows-builder.yml`、`linux-builder.yml`：

1. `pnpm i`（Node 取 `.nvmrc`，pnpm 11.5.0）
2. `check-version`：`git ls-remote` 比较 `package.json` 版本与已有 tag，相同则跳过构建
3. checkout `microsoft/vscode@VSCODE_VERSION` 到 `lib/vscode`
4. `build:common-package` → `move:extension` → 在 `lib/vscode` 内跑 user 安装包任务
5. `softprops/action-gh-release` 发布 `.build/**/*.{exe,deb,tar.gz}`，tag = 版本号
6. 通知版本管理服务，客户端自动更新

发版只需要改 `package.json` 的 `version` 并推 `master`。

---

## 13. 已知约束

- **必须与 VS Code 版本对齐**。升级流程：改 workflow 里的 `VSCODE_VERSION` 与 `package.json` 版本 → 跑 `build:common-package` → 修 `script/change-vscode/index.ts` 中失效的 query。
- `lib/vscode`、`lib/VSCode-*`、`dist`、`test-dist` 均不入库，首次构建耗时主要在 VS Code 依赖安装与 min 构建。
- 依赖 `enabledApiProposals`（chat provider、text search provider、language model tools 等），本地运行需 `--enable-proposed-api`。
- Windows 构建需要 MSVC 与 Python：`onnxruntime-node`、`sharp`、`@napi-rs/canvas`、`@shenghuabi/python-addon` 都要编译。
- `pnpm-workspace.yaml` 里对 `onnxruntime-node` 做了版本 override，避免多版本共存导致推理崩溃。
