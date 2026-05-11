import {
  completePromise,
  FileQueryList,
  nextPromise,
  stringToFileBuffer,
  type ScriptFunction,
} from '@code-recycle/cli';
import { readFileSync } from 'fs';
import { join } from 'path';
import { arch, platform } from 'os';
import { sync } from 'fast-glob';
import { $ } from 'execa';
let envConfigTemplate = readFileSync(
  join(__dirname, 'insert-template', 'gettingStarted.contribution.ts'),
  {
    encoding: 'utf-8',
  },
);

let languageConfig = {
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '<', close: '>' },
    { open: '《', close: '》' },
    { open: '（', close: '）' },
    { open: '【', close: '】' },
    { open: '“', close: '”' },
    { open: '‘', close: '’' },
    { open: '〔', close: '〕' },
  ],

  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
    ['"', '"'],
    ["'", "'"],
    ['<', '>'],
    ['《', '》'],
    ['（', '）'],
    ['【', '】'],
    ['“', '”'],
    ['‘', '’'],
    ['〔', '〕'],
  ],
};
let defaultLanguage = `if (typeof firstLine === 'string') {
		let article = nonUserRegisteredAssociations.find((item) => item.id === 'wenzhang')
		if (article) {
			return [article, { id: PLAINTEXT_LANGUAGE_ID, mime: Mimes.text }]
		}
	}`;
let packageJSON = require('../../data/package.json');
const fn: ScriptFunction = async (util, rule, host, injector) => {
  const scriptCwd = util.filePathGroup.scriptCwd;
  const templatePath = util.path.join(
    scriptCwd,
    'script/change-vscode/template',
  );

  const fileList = [
    ...sync('**/*', { cwd: join(__dirname, 'template'), dot: true }),
  ];
  // todo 需要替换图标,用svg

  for (const item of fileList) {
    const data = await nextPromise(
      host.read(util.path.join(templatePath, item)),
    );
    await completePromise(
      host.write(util.path.join(util.filePathGroup.root, item), data),
    );
  }
  const nExt = util.path.normalize('./extensions');
  // const extensionList = await nextPromise(host.list(nExt));
  // for (const item of extensionList) {
  //   if (
  //     item.startsWith('yaml') ||
  //     item.startsWith('json') ||
  //     item.startsWith('xml') ||
  //     item.startsWith('html') ||
  //     item.startsWith('css') ||
  //     item.startsWith('markdown-') ||
  //     item === 'configuration-editing' ||
  //     item === 'media-preview' ||
  //     item === 'git' ||
  //     item === 'git-base' ||
  //     item.startsWith('typescript') ||
  //     item.startsWith('theme-')
  //   ) {
  //     continue;
  //   }
  //   const result = await nextPromise(
  //     host.isDirectory(util.path.join(nExt, item)),
  //   );
  //   if (!result) {
  //     continue;
  //   }
  //   await completePromise(host.delete(util.path.join(nExt, item)));
  // }
  const list = await util.changeList([
    // { type: 'copy', from: templatePath, to: './' },
    {
      path: './package-lock.json',
      list: [
        {
          query:
            'property:has(>string[value*=node_modules/@vscode/gulp-electron])',

          delete: true,
          multi: true,
          offset: [0, +1],
          description: `改npm后override不生效`,
        },
      ],
      parser: { use: 'jsonc-parser', language: 'json' },
    },
    {
      path: './package.json',
      list: [
        {
          query:
            'property:has(>string[value*="update-build-ts-version"])::children(1)',
          replace: '"tsc -p ./build/tsconfig.build.json"',
        },
        {
          query:
            'property:has(>string[value=\\"scripts"])>object::children(-1)',
          insertAfter: true,
          replace: `,

    "build:common:win32":"npm run update-build-ts-version && npm run gulp vscode-win32-x64-min",
    "build:user:win32-x64":"npm run gulp vscode-win32-x64-inno-updater && npm run gulp vscode-win32-x64-user-setup",
    "build:system:win32-x64":"npm run gulp vscode-win32-x64-inno-updater && npm run gulp vscode-win32-x64-system-setup",
    "build:output":"npm run gulp vscode-output-${platform()}-${arch()}",
    "build:linux":"npm run update-build-ts-version && npm run gulp vscode-linux-x64-min",
    "package:linux:deb":"npm run gulp vscode-linux-x64-prepare-deb && npm run gulp vscode-linux-x64-build-deb"`,
        },
        {
          query: 'property:has(>string[value=\\"gulp\\"])::children(1)',
          replace:
            '"node --max-old-space-size=24384 --optimize-for-size ./node_modules/gulp/bin/gulp.js"',
        },
        // {
        //   query:
        //     'property:has(>string[value=\\"watch-extensions\\"])::children(1)',
        //   replace:
        //     '"node --max-old-space-size=4095 ./node_modules/gulp/bin/gulp.js watch-extensions"',
        // },
        {
          query: 'property:has(>string[value=\\"version"])::children(-1)',
          // 与修改版本用于发新版本.修订版本
          replace: `"${process.env['PUBLISH_VERSION'] ?? '1.103.999'}"`,
        },
        {
          query:
            'property:has(>string[value=\\"author"])::children(-1)>:has(>string[value=\\"name"])::children(-1)',
          replace: '"Chen"',
        },
        // {
        //   query:
        //     'property:has(>string[value*=@vscode/gulp-electron])::children(1)',
        //   replace: `"1.36.0"`,
        //   description: `改图标问题,不知道为何失效了`,
        // },
        //     {
        //       query:
        //         'property:has(string[value*=overrides])::children(1)::children(0)',
        //       replace: `,
        // "@vscode/gulp-electron":{
        //   "rcedit":"^1.1.0"
        // }`,
        //       insertAfter: true,
        //       description: `改图标问题,不知道为何失效了`,
        //     },
      ],
      parser: { use: 'jsonc-parser', language: 'json' },
    },
    // 加入worker 减少并发,防止溢出
    // {
    //   path: 'build/lib/mangle/index.ts',
    //   list: [
    //     {
    //       query: 'CallExpression:like(workerpool.pool)>SyntaxList::children(2)',
    //       replace: `{
    // 	maxWorkers: 5,
    // 	minWorkers: 'max',
    // }`,
    //     },
    //   ],
    // },
    // 先不改。因为用插件
    // {
    //   path: 'src/vs/base/common/network.ts',
    //   list: [
    //     {
    //       query: 'VariableDeclaration:like(builtinExtensionsPath)>StringLiteral',
    //       replace: `'vs/../../custom-extensions'`,
    //     },
    //   ],
    // },
    {
      path: 'src/vs/editor/common/languages/modesRegistry.ts',
      list: [
        // {
        //   query:
        //     'VariableDeclaration:like(PLAINTEXT_LANGUAGE_ID)>StringLiteral',
        //   replace: `'hanyu'`,
        // },
      ],
    },
    {
      path: 'src/vs/workbench/contrib/webview/browser/webviewElement.ts',
      list: [
        {
          query:
            'VariableDeclaration:like(allowRules)>ArrayLiteralExpression>CloseBracketToken',
          insertBefore: true,
          replace: `,'keyboard-map','microphone'`,
        },
      ],
    },

    // {
    //   path: 'build/gulpfile.extensions.js',
    //   list: [
    //     {
    //       query: `VariableDeclaration:has(>Identifier[value=compilations])>ArrayLiteralExpression`,
    //       replace: JSON.stringify([
    //         'extensions/markdown-language-features/preview-src/tsconfig.json',
    //         'extensions/markdown-language-features/tsconfig.json',
    //         'extensions/markdown-math/tsconfig.json',
    //         'extensions/json-language-features/client/tsconfig.json',
    //         'extensions/json-language-features/server/tsconfig.json',
    //         'extensions/markdown-math/tsconfig.json',
    //         'extensions/git/tsconfig.json',
    //         'extensions/git-base/tsconfig.json',
    //         'extensions/media-preview/tsconfig.json',
    //         'extensions/css-language-features/client/tsconfig.json',
    //         'extensions/css-language-features/server/tsconfig.json',
    //         'extensions/typescript-language-features/test-workspace/tsconfig.json',
    //         'extensions/typescript-language-features/web/tsconfig.json',
    //         'extensions/typescript-language-features/tsconfig.json',
    //         'extensions/html-language-features/client/tsconfig.json',
    //         'extensions/html-language-features/server/tsconfig.json',
    //       ]),
    //     },
    //   ],
    // },
    // {
    //   path: 'build/npm/dirs.js',
    //   list: [
    //     {
    //       query: `VariableDeclaration:has(>Identifier[value=dirs])>ArrayLiteralExpression`,
    //       replace: JSON.stringify([
    //         '',
    //         'build',
    //         'extensions',
    //         'extensions/configuration-editing',
    //         'extensions/json-language-features',
    //         'extensions/json-language-features/server',
    //         'extensions/markdown-language-features',
    //         'extensions/markdown-math',
    //         'extensions/media-preview',
    //         'extensions/git',
    //         'extensions/git-base',
    //         'remote',
    //         'remote/web',
    //         'test/automation',
    //         'test/integration/browser',
    //         'test/monaco',
    //         'test/smoke',
    //         '.vscode/extensions/vscode-selfhost-test-provider',
    //         'extensions/css-language-features',
    //         'extensions/css-language-features/server',
    //         'extensions/typescript-language-features',
    //         'extensions/html-language-features',
    //         'extensions/html-language-features/server',
    //       ]),
    //     },
    //   ],
    // },
    // {
    //   path: 'src/vs/workbench/workbench.common.main.ts',
    //   list: [
    //     {
    //       query: `ImportDeclaration:has([value*=vs/workbench/contrib/debug/browser/debugEditorContribution],[value*=vs/workbench/contrib/debug/browser/breakpointEditorContribution],[value*=vs/workbench/contrib/debug/browser/callStackEditorContribution],[value*=vs/workbench/contrib/debug/browser/repl],[value*=vs/workbench/contrib/debug/browser/debugViewlet],[value*=vs/workbench/contrib/externalTerminal/browser/externalTerminal.contribution],[value*=welcomeWalkthrough/browser/walkThrough.contribution],[value*=contrib/tasks/browser/task.contribution],[value*=remote.contribution])`,
    //       delete: true,
    //       multi: true,
    //     },
    //   ],
    // },
    // {
    //   path: 'src/vs/workbench/contrib/debug/browser/debug.contribution.ts',
    //   list: [
    //     {
    //       query: `ExpressionStatement:not(:like(registerSingleton),:like(configurationRegistry))`,
    //       delete: true,
    //       multi: true,
    //     },
    //     {
    //       query: `VariableStatement:has(Identifier:like(viewContainer),Identifier:like(viewsRegistry),Identifier:like(VIEW_CONTAINER),Identifier:like(registerTouchBarEntry),Identifier:like(registerDebugViewMenuItem),Identifier:like(registerDebugCommandPaletteItem),Identifier:like(debugCategory))`,
    //       delete: true,
    //       multi: true,
    //     },
    //     {
    //       query: `ImportDeclaration:has(>StringLiteral[value$=".css\'"])`,
    //       delete: true,
    //       description: '删除无用终端代码样式',
    //       multi: true,
    //     },
    //   ],
    // },
    {
      path: 'build/linux/dependencies-generator.ts',
      list: [
        {
          query: `ImportEqualsDeclaration:like(product)`,
          delete: true,
          description: '删除导入',
        },
        {
          query: `VariableStatement:has(Identifier:like(FAIL_BUILD_FOR_NEW_DEPENDENCIES)) TrueKeyword`,
          replace: 'false',
          description: '禁止依赖检查',
        },
        {
          query: `ExpressionStatement:like(files.push):like(product.tunnelApplicationName)`,
          delete: true,
          description: '删除tunnel',
        },
      ],
    },
    {
      path: 'build/gulpfile.vscode.js',
      list: [
        // todo 为何删除?感觉好像没有理由...
        // {
        //   query: `CallExpression Identifier:like(compileExtensionMediaBuildTask)`,
        //   offset: [0, 1],
        //   delete: true,
        //   description: '媒体任务构建删除',
        // },
        {
          query: `FunctionDeclaration:has(>[value=patchWin32DependenciesTask])>Block ObjectLiteralExpression PropertyAssignment:has(>[value=\\'CompanyName'])::children(-1)`,
          replace: `'Chen'`,
          description: '公司名',
        },
        {
          query: `FunctionDeclaration:has(>[value=patchWin32DependenciesTask])>Block ObjectLiteralExpression PropertyAssignment:has(>[value=\\'LegalCopyright'])::children(-1)`,
          replace: `'Chen'`,
          description: '版权',
        },
      ],
    },
    {
      path: 'src/main.ts',
      list: [
        {
          query: `VariableDeclaration:like(osLocale) QuestionQuestionToken+StringLiteral`,
          replace: `'zh-cn'`,
          description: '改默认的语言',
        },
        {
          query: `CallExpression:has(Identifier[value=getUserDefinedLocale])`,
          replace: `{{''|ctxValue}} ?? 'zh-cn'`,
          description: '默认语言',
        },
        {
          query: `VariableStatement:has(Identifier[value=osLocale])`,
          insertBefore: true,
          replace: `import { createHash } from "crypto";

async function getDefaultZhLanguage(userDataPath = '',) {
  if ('extensionDevelopmentPath' in args) { return }
	let nlsMetadataPath = __dirname
	let languagePacksPath = path.join(userDataPath, 'languagepacks.json')
	try {
		await fs.promises.stat(languagePacksPath)
		return
	} catch (error) { }
	let defaultZhPkgDir = path.join(nlsMetadataPath, '..\\\\extensions\\\\MS-CEINTL.vscode-language-pack-zh-hans')
	let packageJsonMeta = JSON.parse(await fs.promises.readFile(path.join(defaultZhPkgDir, 'package.json'), { encoding: 'utf-8' }))
	let list = packageJsonMeta.contributes.localizations
	let __metadata = packageJsonMeta.__metadata
	let obj:Record<string,any> = {}
	for (const item of list) {
		let key = item.languageId;
		obj[key] ??= {
			hash: '',
			extensions: [],
			translations: {},
			label: item.localizedLanguageName
		}
		obj[key].extensions.push({
			extensionIdentifier: {
				id: \`\${packageJsonMeta.publisher}.\${packageJsonMeta.name}\`.toLowerCase(),
				uuid: __metadata.id
			},
			version: packageJsonMeta.version,
		})
		for (const translation of item.translations) {
			obj[key].translations[translation.id] = path.join(defaultZhPkgDir, translation.path)
		}
	}
	for (const key in obj) {
		let pkgConfig = obj[key].extensions;
		const md5 = createHash('md5');
		for (const extension of pkgConfig) {
			md5.update(extension.extensionIdentifier.uuid || extension.extensionIdentifier.id).update(extension.version);

		}
		obj[key].hash = md5.digest('hex')
	}
	await fs.promises.writeFile(languagePacksPath, JSON.stringify(obj))
}\n`,
          description: '中文(插件部分没有)',
        },
        {
          query: `IfStatement:has(>[value=userLocale])>Block BinaryExpression:has([value=nlsConfigurationPromise])::children(2)`,
          replace: `getDefaultZhLanguage(userDataPath).then(() => {{''|ctxValue}})`,
          description: '调用',
        },
        {
          query: `ArrayLiteralExpression:has([value=\\'vscode-webview']):has([value=\\'vscode-file'])`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `,
	{
		scheme: 'shb',
		privileges: { secure: true, standard: true, supportFetchAPI: false, corsEnabled: true, codeCache: true, bypassCSP: true }
	}`,
          description: '自定义文件策略',
        },
      ],
    },
    {
      path: 'src/vs/workbench/electron-browser/parts/dialogs/dialogHandler.ts',
      list: [
        {
          query: `VariableStatement:has(Identifier[value=detailString]) CallExpression:like(localize)>SyntaxList>CommaToken+StringLiteral`,
          replace: (data) => {
            let value = data.pipe['ctxValue']('') as string;

            return `"软件名: 生花笔\\n基于VSCode二次开发\\n官网: https://shenghuabi.top\\n${value.slice(
              1,
              -1,
            )}"`;
          },
          description: '关于修改',
        },
        {
          query: `VariableStatement:has(Identifier[value=detailString]) CallExpression:like(localize) StringLiteral[value*=aboutDetail]`,
          replace: `'shenghuabi.aboutDetail'`,
          description: '改翻译key',
        },
      ],
    },
    // {
    //   path: 'src/vs/workbench/contrib/terminal/browser/terminal.contribution.ts',
    //   list: [
    //     {
    //       query: `VariableStatement`,
    //       delete: true,
    //       description: '删除无用终端代码',
    //       multi: true,
    //     },
    //     {
    //       query: `ExpressionStatement:not(:like(registerSingleton),:like(registerTerminalPlatformConfiguration),:like(registerTerminalConfiguration))`,
    //       delete: true,
    //       description: '删除无用终端代码',
    //       multi: true,
    //     },
    //     {
    //       query: `FunctionDeclaration,EnumDeclaration`,
    //       delete: true,
    //       description: '删除无用终端代码',
    //       multi: true,
    //     },
    //     {
    //       query: `ImportDeclaration:has(>StringLiteral[value$=".css\'"])`,
    //       delete: true,
    //       description: '删除无用终端代码样式',
    //       multi: true,
    //     },
    //   ],
    // },
    // {
    //   path: 'src/vs/workbench/browser/actions/helpActions.ts',
    //   list: [
    //     {
    //       query: `CallExpression:like(OpenLicenseUrlAction),CallExpression:like(OpenYouTubeUrlAction)`,
    //       delete: true,
    //       description: '删除无用终端代码',
    //       multi: true,
    //     }
    //   ],
    // },
    {
      path: 'src/vs/workbench/contrib/welcomeGettingStarted/browser/gettingStarted.contribution.ts',
      list: [
        {
          query: `SourceFile`,
          replace: envConfigTemplate,
          description: '替换环境配置',
        },
      ],
    },
    // {
    //   path: 'src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts',
    //   list: [
    //     {
    //       query: `ExpressionStatement:not(:like(registerSingleton))`,
    //       delete: true,
    //       multi: true,
    //     },
    //     {
    //       query: `VariableStatement,TypeAliasDeclaration`,
    //       delete: true,
    //       multi: true,
    //     },
    //     {
    //       query: `FunctionDeclaration`,
    //       delete: true,
    //       multi: true,
    //     },
    //     {
    //       query: `ClassDeclaration`,
    //       delete: true,
    //       multi: true,
    //     },
    //   ],
    // },
    // {
    //   path: 'src/vs/platform/extensionManagement/common/extensionGalleryService.ts',
    //   list: [
    //     {
    //       query: `MethodDeclaration:has(>Identifier[value=query]) VariableStatement:like(let query=new Query())`,
    //       insertAfter: true,
    //       replace: `query = query.withFilter(FilterType.Category, 'Themes');`,
    //       description: '只允许主题插件',
    //     },
    //   ],
    // },
    {
      path: 'src/vs/workbench/browser/parts/globalCompositeBar.ts',
      list: [
        {
          query: `FunctionDeclaration:has(>Identifier[value=isAccountsActionVisible]) TrueKeyword`,
          replace: `false`,
          description: '关闭账户配置',
        },
      ],
    },
    {
      path: 'build/lib/electron.ts',
      list: [
        {
          query: `PropertyAssignment:has(Identifier[value=companyName])>StringLiteral`,
          replace: `'Chen Yang'`,
          description: '公司名',
        },
        {
          query: `PropertyAssignment:has(Identifier[value=copyright])>StringLiteral`,
          replace: `'Chen Yang'`,
          description: '版权',
        },
      ],
    },
    {
      path: 'src/vs/editor/common/config/editorOptions.ts',
      list: [
        {
          query: `PropertyAssignment:has(Identifier[value=ambiguousCharacters])>TrueKeyword`,
          replace: `false`,
          description: '改标点',
        },
        {
          query: `PropertyAssignment:has(Identifier[value=invisibleCharacters])>TrueKeyword`,
          replace: `false`,
          description: '特殊空白',
        },
      ],
    },
    {
      path: 'src/vs/workbench/services/configuration/common/configuration.ts',
      list: [
        {
          query: `VariableDeclaration:has(>Identifier[value=FOLDER_CONFIG_FOLDER_NAME])>StringLiteral`,
          replace: `'.ShengHuaBi'`,
          description: '改配置文件夹',
        },
      ],
    },
    {
      path: 'src/vs/editor/common/languages/languageConfigurationRegistry.ts',
      list: [
        {
          query: `CallExpression:has(Identifier[value=PLAINTEXT_LANGUAGE_ID])>SyntaxList::children(2)`,
          replace: JSON.stringify(languageConfig, undefined, 4),
          description: '改默认语言配置',
        },
      ],
    },
    // 想取消的,但是一想万一人家用了普通的空格感觉不对劲就不好了
    {
      path: 'src/vs/editor/common/viewModel/monospaceLineBreaksComputer.ts',
      list: [
        {
          query: `FunctionDeclaration:has(>Identifier[value=computeWrappedTextIndentLength])>Block`,
          replace: `{tabCharacterWidth;lineText;tabSize;firstLineBreakColumn;columnsForFullWidthChar;wrappingIndent;return 0;}`,
          description: '改缩进',
        },
      ],
    },
    {
      path: 'src/vs/editor/common/services/languagesAssociations.ts',
      list: [
        {
          query: `FunctionDeclaration:like(function getAssociations)>Block>SyntaxList::children(-1)`,
          replace: `${defaultLanguage}\n{{''|ctxValue}}`,
          description: '改默认语言配置',
        },
      ],
    },
    {
      path: 'src/vs/workbench/services/workspaces/common/workspaceTrust.ts',
      list: [
        {
          query: `ClassDeclaration:like(class WorkspaceTrustEnablementService) MethodDeclaration:like(isWorkspaceTrustEnabled)>Block::children(0)`,
          insertAfter: true,
          replace: `if(1){return false};`,
          description: '改默认语言配置',
        },
      ],
    },
    {
      path: 'src/vs/workbench/services/preferences/common/preferences.ts',
      list: [
        {
          query: `VariableDeclaration:has(>[value=FOLDER_SETTINGS_PATH])>StringLiteral`,
          replace: `'.ShengHuaBi/settings.json'`,
          description: '配置跳转',
        },
      ],
    },
    {
      path: 'extensions/configuration-editing/package.json',
      list: [
        {
          query: `property[value*="contributes"] property[value*=jsonValidation]>array`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `,${JSON.stringify({
            fileMatch: '/.ShengHuaBi/settings.json',
            url: 'vscode://schemas/settings/folder',
          })}`,
          description: '默认配置提示',
        },
      ],
    },
    {
      path: 'src/vs/workbench/contrib/inlineChat/browser/utils.ts',
      list: [
        {
          query: `FunctionDeclaration:has(>[value=asProgressiveEdit]) CallExpression:has(>[value=getNWords]) NumericLiteral`,
          replace: `500`,
          description: '修改对话速率',
        },
      ],
    },
    {
      path: 'src/vs/workbench/contrib/files/browser/views/explorerViewer.ts',
      list: [
        {
          query: `SourceFile`,
          insertBefore: true,
          replace: `import { compareFileNamesNumber } from '../../../../../base/common/han-number.comparers.js';\n`,
          description: `插入引入`,
        },
        {
          query: `CaseClause:like(case 'upper':)`,
          insertBefore: true,
          replace: `case 'number':
				compareFileNames = compareFileNamesNumber;
				compareFileExtensions = compareFileExtensionsUpper;
				break;\n`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/contrib/files/common/files.ts',
      list: [
        {
          query: `EnumDeclaration:has(>[value=LexicographicOptions]) EnumMember`,
          insertBefore: true,
          replace: `Number = 'number',`,
          description: `增加枚举`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/contrib/files/browser/files.contribution.ts',
      list: [
        {
          query: `PropertyAssignment:has(>[value=\\'explorer.sortOrderLexicographicOptions']) PropertyAssignment:has(>[value=\\'enum']) ArrayLiteralExpression`,
          offset: [-1, -1],
          insertAfter: true,

          replace: `,LexicographicOptions.Number`,
          description: `增加枚举`,
        },
        {
          query: `PropertyAssignment:has(>[value=\\'explorer.sortOrderLexicographicOptions']) PropertyAssignment:has(>[value=\\'enumDescriptions']) ArrayLiteralExpression`,
          offset: [-1, -1],
          insertAfter: true,
          replace: `, nls.localize('sortOrderLexicographicOptions.number', '名称按 数字 顺序排序')`,
          description: `增加枚举`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/electron-browser/desktop.main.ts',
      list: [
        {
          query: `VariableStatement:has([value=FileService])`,
          insertAfter: true,

          replace: `mainProcessService.getChannel('ShengHuabi').listen('readFile')((value: any) => {
			fileService.readFile(URI.from(value.data)).then((result) => {
				mainProcessService.getChannel('ShengHuabi').call('readFile', [value.index, true, result.value])
			}).catch((reason) => {
				mainProcessService.getChannel('ShengHuabi').call('readFile', [value.index, false, reason])
			})
		})`,
          description: `文件系统桥接`,
        },
      ],
    },
    // {
    //   path: 'src/vs/workbench/api/node/extensionHostProcess.ts',
    //   list: [
    //     {
    //       query: `BinaryExpression:has([value^=process.on])`,

    //       replace: `process.on = <any>function (event: string, listener: (...args: any[]) => void) {
    //         let newFn=listener
    // 	if (event === 'uncaughtException') {
    // 		newFn = function () {
    // 			try {
    // 				return listener.apply(undefined, (arguments as unknown as any[]));
    // 			} catch {
    // 				// DO NOT HANDLE NOR PRINT the error here because this can and will lead to
    // 				// more errors which will cause error handling to be reentrant and eventually
    // 				// overflowing the stack. Do not be sad, we do handle and annotate uncaught
    // 				// errors properly in 'extensionHostMain'
    // 			}
    // 		};
    // 	}
    // 	nativeOn(event, newFn);
    // }`,
    //       description: `修复sentry使用`,
    //     },
    //   ],
    // },
    {
      path: 'build/gulpfile.vscode.linux.js',
      list: [
        {
          query: `FunctionDeclaration:has(>[value=buildDebPackage]) CallExpression:has([value*=fakeroot])`,
          replace:
            'exec(`fakeroot dpkg-deb -Zxz -b ${product.applicationName}-${debArch} deb/${product.applicationName.toLowerCase()}-linux-${arch}-${packageJson.version}.setup.deb`, { cwd })',
          description: `linux deb改名`,
        },
      ],
    },
    {
      path: 'build/gulpfile.vscode.js',
      list: [
        {
          query: `VariableDeclaration:has(>[value=tasks]) ArrayLiteralExpression CallExpression[value^=packageTask]`,
          delete: true,
          description: `普通构建时去掉,手动调用`,
        },
        {
          query: `CallExpression[value^=BUILD_TARGETS] IfStatement:has(>[value^=platform])`,
          replace: `let outputList = [packageTask(platform, arch, sourceFolderName, destinationFolderName, opts)]
		if (platform === 'win32') {
			outputList.push(patchWin32DependenciesTask(destinationFolderName))
		}
		gulp.task(task.define(\`vscode-output\${dashed(platform)}\${dashed(arch)}\`,
			task.series(...outputList)
		));`,
          description: `普通构建时去掉,手动调用`,
        },
      ],
    },
    ...appendWebgpu(),
  ]);
  await util.updateChangeList(list);
  console.log('处理代码完成');
  await host.writeToFs();
  await $({ stdio: 'inherit' })`npm run update:product`;
  console.log('修改完成');
};
function appendWebgpu() {
  return [
    {
      path: 'src/vs/code/electron-main/app.ts',
      list: [
        {
          query: `SourceFile`,
          insertBefore: true,
          replace: `import { ShbChannel } from '../../platform/shenghuabi/electron-main/channel.js';\n`,
          description: `插入引入`,
        },
        {
          query: `ClassDeclaration:has(>Identifier[value=CodeApplication]) MethodDeclaration:has(>Identifier[value=initChannels])>Block`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `mainProcessElectronServer.registerChannel(ShbChannel.channelType, new ShbChannel());`,
          description: `注册main服务`,
        },
        {
          query: `VariableDeclaration:has(>[value=allowedPermissionsInWebview]) ArrayLiteralExpression`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `'media'`,
          description: `麦克风1`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/api/browser/extensionHost.contribution.ts',
      list: [
        {
          query: `SourceFile`,
          insertBefore: true,
          replace: `import './mainThreadShenghuabi.js';\n`,
          description: `插入引入mainThreadShenghuabi`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/api/common/extHost.api.impl.ts',
      list: [
        {
          query: `SourceFile`,
          insertBefore: true,
          replace: `import { IExtHostShenghuabi } from './extHostShenghuabi.js';\n`,
          description: `插入引入mainThreadShenghuabi`,
        },
        {
          query: `FunctionDeclaration:has(>Identifier[value=createApiFactoryAndRegisterActors])>Block VariableStatement:has(Identifier[value=expected])`,
          insertBefore: true,
          replace: `let shenghuabi = rpcProtocol.set(ExtHostContext.ExtHostShenghuabi, accessor.get(IExtHostShenghuabi));`,
          description: `注入`,
        },
        {
          query: `FunctionDeclaration:has(>Identifier[value=createApiFactoryAndRegisterActors])>Block  ReturnStatement>TypeAssertionExpression:like(<typeof vscode>)`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `,shenghuabi`,
          description: `注入`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/api/common/extHost.common.services.ts',
      list: [
        {
          query: `SourceFile`,
          insertBefore: true,
          replace: `import { ExtHostShenghuabi, IExtHostShenghuabi } from './extHostShenghuabi.js';\n`,
          description: `插入引入ExtHostShenghuabi`,
        },
        {
          query: `SourceFile`,
          insertAfter: true,
          replace: `registerSingleton(IExtHostShenghuabi, ExtHostShenghuabi, InstantiationType.Eager);`,
          description: `注册服务`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/api/common/extHost.protocol.ts',
      list: [
        {
          query: `VariableDeclaration:has(>[value=MainContext])`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `MainThreadShenghuabi: createProxyIdentifier<MainThreadShenghuabiShape>('MainThreadShenghuabi')`,
          description: `插入引入MainThreadShenghuabi`,
        },
        {
          query: `VariableDeclaration:has(>[value=ExtHostContext])`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `ExtHostShenghuabi: createProxyIdentifier<ExtHostShenghuabiShape>('ExtHostShenghuabi')`,
          description: `插入引入ExtHostShenghuabi`,
        },
        {
          query: `SourceFile`,
          insertAfter: true,
          replace: `export interface MainThreadShenghuabiShape extends IDisposable {
	$call(id: string, args?: any): any;
}
export interface ExtHostShenghuabiShape {
	$call(id: string, args?: any): any;
}
`,
          description: `插入接口定义`,
        },
      ],
    },
    {
      path: 'src/vs/base/browser/markdownRenderer.ts',
      list: [
        {
          query: `SourceFile`,
          insertBefore: true,
          replace: `let MY_TT: any;
const C_EL_NAME = 'custom-hover-html'
class CustomElement extends HTMLElement {
	shadow
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: 'open' })
	}
	setHtml(el: any) {
		this.shadow.innerHTML = el
		let style = document.createElement('style')
		style.textContent = 'a{cursor: pointer;color:var(--vscode-textLink-foreground)}'
		this.shadow.appendChild(style)
		return this.shadow
	}
}
window.customElements.define(C_EL_NAME, CustomElement);`,
          description: `定义`,
        },
        {
          query: `IfStatement:has(>PropertyAccessExpression[value=options.actionHandler])`,
          insertBefore: true,
          replace: `	let customEl: any | undefined
	if ((markdown as any).isCustomHtml) {
		MY_TT ??= window.trustedTypes!.createPolicy('shb-webcomponent-markdown', {
			createHTML: string => string
		});
		let instance = document.createElement(C_EL_NAME) as any;
		customEl = (instance as CustomElement).setHtml(MY_TT.createHTML(markdown.value))
    while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		element.appendChild(instance);
	}`,
          description: `前面的声明`,
        },
        {
          query: `IfStatement:has(>PropertyAccessExpression[value=options.actionHandler]) Identifier[value=element]`,
          multi: true,
          replace: `customEl ?? {{''|ctxValue}}`,
          description: `中间`,
        },
        {
          query: `FunctionDeclaration:has(>[value=renderMarkdown])  IfStatement:like(if (options.actionHandler))`,
          insertAfter: true,
          replace: `\n	if ((markdown as any).isCustomHtml) {
		return {
			element: element, dispose: () => {
				isDisposed = true;
				disposables.dispose();
			}
		}
	}`,
          description: `后面返回`,
        },
        {
          query: `VariableDeclaration:has([value=allowedLinkSchemes]) ArrayLiteralExpression`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `,'shb'`,
          description: `图片预请求`,
        },
      ],
    },
    {
      path: 'src/vs/workbench/api/common/extHostTypeConverters.ts',
      list: [
        {
          query: `FunctionDeclaration:has(>[value=from]) IfStatement:has(>[value="types.MarkdownString.isMarkdownString(markup)"])>Block ObjectLiteralExpression`,
          insertAfter: true,
          offset: [-1, 0],
          replace: `, isCustomHtml: (markup as any).isCustomHtml } as any`,
          description: `增加自定义参数`,
        },
      ],
    },
    {
      path: 'src/vs/platform/protocol/electron-main/protocolMainService.ts',
      list: [
        {
          query: `PropertyDeclaration:has(>[value=validExtensions]) ArrayLiteralExpression`,
          insertAfter: true,
          offset: [-1, -1],
          replace: `,'.css'`,
          description: `增加css类型允许hover`,
        },
      ],
    },
    {
      path: 'src/vs/editor/contrib/hover/browser/contentHoverWidget.ts',
      list: [
        {
          query: `MethodDeclaration:has(>[value=show])`,
          insertBefore: true,
          replace: `	#listenResizeDispose?: () => void
	#listenResizeChange(el: HTMLElement) {
		this.#listenResizeDispose?.()
		const resizeObserver = new ResizeObserver((entries) => {
			this._hover.scrollbar.scanDomNode()
		});
		resizeObserver.observe(el);
		this.#listenResizeDispose = () => {
			resizeObserver.disconnect()
		}
	}\n`,
          description: `添加方法resize`,
        },
        {
          query: `MethodDeclaration:has(>[value=show]) ExpressionStatement[value^=this._render(renderedHover)]`,
          insertAfter: true,
          replace: `\nthis.#listenResizeChange(this._hover.contentsDomNode.childNodes[0] as HTMLElement);`,
          description: `调用`,
        },
      ],
    },
    {
      path: 'src/vs/platform/webview/electron-main/webviewMainService.ts',
      list: [
        {
          query: `IfStatement:has(>BinaryExpression:like(typeof frame.findInFrame === 'function'))>Block `,
          insertAfter: true,
          replace: ` else {
			frame.executeJavaScript(\`window.document.querySelector('iframe').contentWindow.find('\${text}',false,\${!options.forward},true,false,true,false)\`,).then((result) => {
				this._onFoundInFrame.fire({ requestId: 1, activeMatchOrdinal: 1, matches: result ? 1 : 0, selectionArea: undefined, finalUpdate: true });
			})
		}`,
          description: `搜索支持`,
        },
      ],
    },
    // {
    //   path: 'build/lib/optimize.ts',
    //   list: [
    //     {
    //       query: `FunctionDeclaration:has(>[value=minifyTask]) CallExpression:has(>[value=esbuild.build]) ObjectLiteralExpression`,
    //       insertAfter: true,
    //       offset: [-1, -1],

    //       replace: `,
    // 			charset: 'utf8'`,
    //       description: `编码为utf8`,
    //     },
    //     {
    //       query: `VariableDeclaration:has(>[value=unicodeMatch]) >CallExpression`,
    //       replace: `false`,
    //       description: `忽略unicode检查`,
    //     },
    //   ],
    // },
    // {
    //   path: 'src/vs/workbench/contrib/inlineChat/browser/inlineChatSessionServiceImpl.ts',
    //   list: [
    //     {
    //       query: `ClassDeclaration:has(>[value=InlineChatEnabler]) Constructor BinaryExpression:has(StringLiteral[value=\\'github.copilot.editor'])`,

    //       replace: `agent?.id === 'github.copilot.editor' || agent?.id === 'setup.editor' || agent?.id === 'shenghuabi.chat.editor'`,
    //       description: `内联对话`,
    //     },
    //   ],
    // },
  ] as FileQueryList;
}
export default fn;
