export const ENTRY_HELP_LIST = [
  `### 通用`,
  `- {{ENTRY.knowledge}} 知识库名`,
  `- {{ENTRY.content}} 内容`,
  `- {{ENTRY.loc.lines.from}} 所在文件的行数起始`,
  `- {{ENTRY.loc.lines.to}} 所在文件的行数终止`,
  `### 知识库变量`,
  `- {{ENTRY.fileName}} 文本片段的文件名`,
  `### 字典变量`,
  `- {{ENTRY.word}} 单词名`,
  `- {{ENTRY.extra.xx}} 自定义添加数据`,
  `### 文章变量`,
  `- {{ENTRY.fullName}} 相对当前工作区的文件名路径`,
  `- {{ENTRY.name}} 文件名`,
  `- {{ENTRY.dir}} 相对当前工作区的文件夹`,
];

export const NODE_HELP_LIST = [
  `- {{ENTRY.name}} 实体名`,
  `- {{ENTRY.type}} 实体类型`,
  `- {{ENTRY.description}} 实体描述`,
  `- {{ENTRY.fileName}} 所在文件名`,
  `- {{ENTRY.knowledge}} 知识库名`,
];
export const EDGE_HELP_LIST = [
  `- {{ENTRY.name}} 联系名(来源,目的)`,
  `- {{ENTRY.source}} 来源实体名`,
  `- {{ENTRY.target}} 目的实体名`,
  `- {{ENTRY.keywords}} 关键字`,
  `- {{ENTRY.description}} 实体描述`,
  `- {{ENTRY.fileName}} 所在文件名`,
  `- {{ENTRY.knowledge}} 知识库名`,
];
