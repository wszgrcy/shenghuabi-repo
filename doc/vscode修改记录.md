# 
## 协议
- `vscode-file://vscode-app`一般webview里的路径都是这个.然后文件路径都是`/`开头,包括windows

## 调试
- 部分log只保存在日志中,不显示在启动的console.log,需要用内部的服务日志输出,然后找对应文件
> 记得改优先级
# 文件
## src\vs\platform\webview\electron-main\webviewMainService.ts:50
- 文本型webview支持搜索使用
> 自定义了一个高亮方法覆盖
> window.find已经废弃,看看能撑多久

## src\vs\editor\contrib\hover\browser\hoverTypes.ts
- 可能是hover注册显示用的
- vscode有多个显示模型,hover只是其中一个

## src\vs\editor\contrib\hover\browser\markdownHoverParticipant.ts
- 也是 markdown hover相关

## src\vs\base\browser\markdownRenderer.ts
- 直接改markdown的

## src\vs\workbench\contrib\webview\browser\resourceLoading.ts
- 好像是资源加载失败时可以debug这里?
- 记得好像是webview设置安全文件夹时有问题时调试的这里?

## src\vs\code\electron-main\app.ts
- 181 setPermissionCheckHandler 字体支持.默认webview给屏蔽了

## src\vs\workbench\api\common\extHostCommands.ts
- 拓展相关
## src\vs\workbench\api\browser\mainThreadCommands.ts
- 拓展相关.网页部分
## src\vs\workbench\api\common\extHost.api.impl.ts
- 拓展.导出定义,就是拓展输入的那个定义

## src\vs\workbench\api\browser\extensionHost.contribution.ts
- 拓展服务需要注册的地方

## src\vs\workbench\services\extensions\electron-sandbox\localProcessExtensionHost.ts
- 启动拓展的

## src\vs\code\electron-main\app.ts:1215
- 拓展与main(electron环境)交互时需要注册的

## src\vs\workbench\api\node\extensionHostProcess.ts
- main监听插件用的?

## src\vs\platform\native\electron-main\auth.ts
- 鉴权,未来准备改这个

## src\vs\workbench\electron-sandbox\window.ts
- 网页端入口

## src\vs\code\electron-sandbox\workbench\workbench-dev.html
- 好像是webview外部套的那一层
## src\vs\platform\windows\electron-main\windowImpl.ts
- electron启动window
## src\vs\code\electron-sandbox\workbench\workbench.js
- 网页js页面入口

## src\vs\workbench\services\log\electron-sandbox\logService.ts
- 19行 //logLevel: 'always'增加日志
## build\gulpfile.vscode.js
- 构建命令,以后研究下如何仅部分构建,就是用vscode本体构建一次,然后剩下插件单独构建,然后利用这个构建
## 升级
- electron如果变化需要修改`script\change-vscode\template\.npmrc`
> 版本升级后,还用旧版本electron或者报错需要改这个
- 升级后可能有依赖问题,需要删除所有重装
> 不知道怎么回事,`.node`的依赖莫名其妙消失,安装后又回来了,猜测可能是安装一半失败了?

## 相关命令
- `npm run gulp vscode-win32-x64`
> 查看本地构建,在`vscode`的同级文件夹中

## 国际化
- 国际化依赖git,如果没有git版本,那么就不会切换为中文