<help-search></help-search>

## 使用指南

- 软件的功能都是基于工作区实现, 请<command-button command="workbench.action.files.openFolder" check="workspace">选择/新建一个文件夹</command-button>
  > 未选择文件夹时部分功能将受到限制
- 第一次使用时，建议使用<command-button command="open-environment-configuration" prefix check="configuration">环境配置页面</command-button>进行快速配置
  > 环境配置页面可以将ai部分配置快速的修改和安装
- [版本更新日志](https://bbs.shenghuabi.site/c/9-category/9)

## 关于本软件

- 网站唯一官网[生花笔](https://shenghuabi.top)
- [交流论坛](https://bbs.shenghuabi.site)
- 本软件基于VSCode进行二次开发，融合AI对话,TTS,OCR,知识库与字典,脑图,使其对写作更加友好
- 所有需要额外下载的工具都可以在国内网络环境下进行下载,只要按照顺序进行下载即可成功安装
> 如果下载模型异常,则为huggingface限制,需要[设置token](https://bbs.shenghuabi.site/t/topic/309)
## 所有配置

- 打开<command-button command="workbench.action.openWorkspaceSettingsFile" options='{"openToSide":true,"query":"shenghuabi"}'>设置文件</command-button>

---

## 语言

- 允许关联脑图中的`卡片`及`对话`，以标题为高亮/补全词，

![文章中](../data/document/image/卡片补全.webp)

![编辑配置](../data/document/image/卡片定义.webp)

### 高亮

- 默认开启，允许修改部分高亮样式

### 补全

- 支持拼音补全
- 自定义触发词

### 查看定义

- 鼠标悬停到已定义的词上时，可以查看该词在脑图中的定义

### 字典查询

- 鼠标选中词语后,悬停查询当前选中内容
- 支持精确查询与模糊查询(比较相似度)
  > 需要预先导入字典

### 其他文件转换

- `pptx`, `odt`, `odp`, `ods`, `pdf`, `docx`, `epub`格式的文件可以转换为纯文本格式
- 右键点击需要转换的文件,点击`文档转换`

![文档转换](../data/document/image/文档转换.webp)

- `jpg`, `jpe`, `jpeg`, `jfif`, `png`, `webp`, `bmp`, `tif`, `tiff`, `avif`, `heic`, `heif`等图片格式可以使用`图像识别`功能转换为纯文本格式

![文档转换](../data/document/image/图像识别.webp)

---

## 知识库

- 知识库是将导入信息切割成片段保存在向量数据库中，方便用户进行模糊查询
- 目前知识库是配合大语言模型使用，通过提取出有限数量的内容，再由大语言模型提炼总结返回
- 使用知识库查询的好处是可以使用自然语言查询某个问题并且回答的答案是限定在知识库内，极大减少了大模型的幻觉

- ![知识库](../data/document/image/知识库导入.webp)

### 注意事项

- 分隔相关参数在创建后无法修改
- 导入文件后不要到知识库中修改文件的文件名
- 每次编辑文件内容相当于删除原文件并重新导入这个文件一次，因此如果要追加内容推荐导入一个新的文件
- 分隔长度越小，搜索命中就越高，但是提取到的关键信息就越少；越长提取到的关键信息多，但是搜索命中可能就会变低

### 导入格式

- 支持`纯文本`,`srt`,`csv`,`pptx`, `odt`, `odp`, `ods`, `pdf`, `docx`, `epub`导入
- 部分文件导入时会拆分为多个子文件
  > 比如`pdf`,`epub`

---

## 字典

- 字典导入与知识库类似,都是保存在向量数据库中,只不过字典导入是一次性的不会再往该集合中增加新内容
- 字典目前支持`mdict`/`stardict`字典
- 字典支持`图片检索`允许搜索图片内的文字并返回匹配词条

- ![字典](../data/document/image/字典导入.webp)

### 资源

- 你可以从以下网站获取字典资源,如果有更好的下载网站欢迎推荐
  > [startdict](https://www.nchrs.xyz/stardict/zh_CN/index.html) >[mdict](https://downloads.freemdict.com/Recommend/)

## 搜索

- ![字典](../data/document/image/字典搜索.webp)

- 目前支持字典与知识库的智能搜索,只需要输入想搜索的内容,就可以返回与之**相关**的结果

## 脑图

- 新建文件命名为`xxx.nt`/`xxx.naotu`
- 右键创建新的节点
- 支持存储列表，将不用的节点保存起来
- 支持节点布局排版
- 支持节点相关样式调整
- 支持节点折叠
- 支持双向边
  ![脑图概览](../data/document/image/脑图概览.webp)

### 支持节点

- 文本节点: 用于构建基础的脑图,
- 对话节点: 可以在脑图中创建节点并直接对话
- 卡片节点: 创建的卡片内容可以与文章联动,在写文章时可以补全,高亮,重命名,信息提示及跳转
- 图片节点: 显示一张图片
- 外框: 非直接生成节点,按住shift选中节点后,右键对选中节点生成外框.如果想要只删除外框,需要右键解除操作
- 绘图节点: 上侧工具栏点击`打开绘图`使用

### 生成

- 右键生成节点
- 开启`拖动生成`后,在连接点上拖动线到任意位置后释放生成与当前节点相同类型的节点
- 开启`点击生成`后,点击连接点会生产与当前节点相同类型的节点
- AI生成,通过配置工作流生成元数据,然后构建节点

### 批量导入

- 您可以参考`default/脑图节点批量导入.workflow`工作流导入节点
- 在脑图中创建对话节点并执行构建
- 文件格式如下(yaml文件)

```yaml
list:
  - title: 测试1
    content: |-
      ## 多行文本测试1
      ### 多行文本测试2
    relations:
      - to: 测试2
        label: 标签名字
  - title: 测试2
    content: |-
      被调用内容
      ![test](./test.png)
  - title: 调用外部
    contentPath: ./test.txt
  - contentPath: ./文本节点组.md
    type: text
```

`文本节点组.md`

```md
# 一级 1

## 二级 1

### 三级 1

- 四级
  - 五级...

## 二级 2

# 一级 2
```

- `content`与`contentPath`字段必须存在一个
- `type: text`表示导入的是一个文本节点组

### 文本组转卡片

- 框选需要转换的节点,右键`转换为卡片`
  > 支持`文本节点`,`卡片`(转换为链接),`图片`
  > 不支持双向边,转换前需要检查

### 卡片转文本组

- 在卡片节点上右键`转换为文本组`
  > 支持`文本节点`,`卡片引用`,`图片`

---

## 对话

- 使用本地/远程大语言模型进行对话
- 支持使用图片进行对话
  ![对话](../data/document/image/对话.webp '=254x521.5')

### 普通对话

- 与正常大语言模型一样使用方式,直接使用就可以对话

### 上下文

- 需要一些模板预制进行对话,允许读取文章和知识库
- 可定制内容较少,方便快速进行一些简单的配置

### 工作流

- 更加复杂的场景,处理不同的内容
- 支持文件/知识库/分类/脑图节点生成等多种节点

## 对话应用

### 直接使用

- 正常情况下,可以使用以上三种类型的对话,只要在侧边栏中切换到聊天中即可

### 选中操作

- 写作中,可以通过配置的选中处理操作,对选中内容进行提问,并可将返回内容快速替换到选中内容上
  > 选中后点击黄色灯泡图标或右键点击`重构`

![选择处理](../data/document/image/选择处理.webp '=422x521.5')

### 逐行(工作流)

- 对每一行传入工作流并执行,返回修改

- ![工作流操作](../data/document/image/工作流操作.webp)

#### 文本纠错

- 默认`[逐行对话]文本纠错`

### 全文(工作流)

- 将全文传入工作流并执行,返回修改

### 节点构建(工作流)

- 通过设计工作流,按照指定格式传入,可以将文件内容提取为节点元数据,并在脑图中构建

---

## 工作流设计

- 自动捕获未定义变量
  > 只需要输入需要的变量,未被提供的变量将会出现在输入窗口中
- 流程中不能出现多个独立节点
  > 因为是自动计算所以目前图中不允许有不使用的节点

![工作流操作](../data/document/image/工作流.webp)

### 连接点

- 用于在没有其他特定输入的前提下,前一个节点连接到后一个节点使用
  > 比如`分类器`与下一个节点没有特定的输入关系,所以使用连接点
- 有些节点只有唯一一个连接点,接收数据进行处理
  > `数组合并`,`迭代`等

### 验证

- 支持普通文本输入与yaml格式输入
- yaml 时需要遵循使用时定义的格式

![工作流验证](../data/document/image/工作流验证.webp)

### 节点

#### 外界输入

- 用于软件内部使用,输入一个对象类型
- 行处理使用`{line:string}`类型
- 全文处理使用`{content:string}`类型

![工作流操作](../data/document/image/工作流编辑1.webp)

#### 文章/文件

- 传入内容

#### 迭代

- 用于处理文章切片或者多个文件

#### 数组合并

- 文章或文件可能存在多级数组,用于拍平

#### 格式定义

- 用于在脑图中生成卡片

#### 对话

- 用于设计对话模板与执行

### 服务器

- 在设置中开启服务器

```json
  "shenghuabi.server": {
        "enable": true
    },
```

#### workflow/exec

- 调用工作流后返回一个结果`{value:any,extra?:any}`

```ts
let headersList = {
  Accept: '*/*',
  'Content-Type': 'application/json',
};

let bodyContent = JSON.stringify({ input: {}, name: 'cg/cg-text' });

let response = await fetch('http://127.0.0.1:1127/workflow/exec', {
  method: 'POST',
  body: bodyContent,
  headers: headersList,
});

let data = await response.text();
console.log(data);
```

#### workflow/stream

- 调用工作流后每个节点执行时都返回数据(类似openai的流式响应)

```ts
import { fetchEventSource } from '@microsoft/fetch-event-source';

let result = fetchEventSource('http://127.0.0.1:1127/workflow/stream', {
  method: 'POST',
  headers: headersList,
  body: bodyContent,
  signal: ctrl.signal,
  onmessage: (a) => {
    console.log(a.data);
  },
});
```

---

## OCR(光学字符识别)

- 该功能已内置
- 支持 `jpg`,`jpe`,`jpeg`,`jfif`,`png`,`webp`,`bmp`,`tif`,`tiff`,`avif`,`heic`,`heif`,格式的图片转文字
- 在图片上右键`图像识别`,生成文本文件`<图片名>-识别`

### 工作流中

- 文件节点支持读取支持格式的图片,返回识别后的文本

### 知识库中

- 读取的支持格式的图片,写入识别后的文笔

### 字典导入

- `图片检索`使用

## 插件

- 工作流自定义节点
- 部分类的重写覆盖

### 实例

- [演示](https://github.com/wszgrcy/shb-ext-demo)
- [neo4j](https://github.com/wszgrcy/shb-ext-neo4j)
- [mcp](https://github.com/wszgrcy/shb-ext-mcp)

---

## 引用

- [qdrant](https://github.com/qdrant/qdrant)
- [wonderful-prompts](https://github.com/langgptai/wonderful-prompts)
- [LangGPT](https://github.com/langgptai/LangGPT)
- [RapidOCR-json](https://github.com/hiroi-sora/RapidOCR-json)
- [pycorrector](https://github.com/shibing624/pycorrector)

---

## 联系我


- 官网 [https://shenghuabi.top](https://shenghuabi.top)
  > 目前仅提供下载用途
- [交流论坛](https://bbs.shenghuabi.site)
