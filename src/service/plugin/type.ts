import {
  FileParserService,
  FileParserToken,
} from '@shenghuabi/knowledge/file-parser';
import { ManifestReturnType } from './define';
import {
  ArticleKnowledgeService,
  ConfigToken,
  ContentParserToken,
  DictKnowledgeService,
  DirToken,
  GraphKnolwdgeService,
  NormalKnowledgeService,
  Text2VecToken,
  TextSplitterToken,
} from '@shenghuabi/knowledge/knowledge';
import { NodeRunnerBase } from '@shenghuabi/workflow';
import { ChatService } from '../ai/chat.service';
import { CustomKnowledgeManagerService } from '../knowledge/custom-knowledge.manager.service';
import { inject, Injector } from 'static-injector';
import { OCRService } from '../external-call/ocr.service';
import { LogToken } from '@shenghuabi/knowledge/util';
import { QdrantClientService } from '@shenghuabi/knowledge/qdrant';
import { ChatUtilService } from '../util/chat.util.service';
import { WorkflowSelectService } from '@shenghuabi/workflow';
import { WorkflowExecService } from '@shenghuabi/workflow';
import { RagWorkflowParser } from '../ai/rag/parse/workflow-parser';
import { LLMLauncherService } from '../llm.launcher.service';
import { TTSSerivce } from '@shenghuabi/python-addon';
import { WorkspaceService } from '../workspace.service';
export interface ManifestInput {
  inject: typeof inject;
  Injector: typeof Injector;
  provider: {
    root: {
      injector: Injector;
      /** 允许重写 */
      FileParserToken: typeof FileParserToken;
      /** 对话 */
      ChatService: typeof ChatService;
      /** 文件解析 */
      FileParserService: typeof FileParserService;
      /** 知识库管理 */
      KnowledgeManagerService: typeof CustomKnowledgeManagerService;
      /** ocr  */
      OCRService: typeof OCRService;
      /** 对话工具类 */
      ChatUtilService: typeof ChatUtilService;
      /** 读取工作流 */
      WorkflowSelectService: typeof WorkflowSelectService;
      /** 执行工作流 */
      WorkflowExecService: typeof WorkflowExecService;
      /** 控制活动的大语言模型启动或停止 */
      LLMLauncherService: typeof LLMLauncherService;
      /** 文本生成语音 */
      TTSSerivce: typeof TTSSerivce;
      /** 工作区 */
      WorkspaceService: typeof WorkspaceService;
    };
    knowledge: {
      /** 允许重写
       * 需要重启
       */
      QdrantClientService: typeof QdrantClientService;
      /** 允许重写 */
      DictKnowledgeService: typeof DictKnowledgeService;
      /** 允许重写 */
      NormalKnowledgeService: typeof NormalKnowledgeService;
      /** 允许重写 */
      GraphKnolwdgeService: typeof GraphKnolwdgeService;
      /** 允许重写 */
      ArticleKnowledgeService: typeof ArticleKnowledgeService;
      /** 文本转向量 */
      Text2VecToken: typeof Text2VecToken;
      /** 文本切分 */
      TextSplitterToken: typeof TextSplitterToken;
      /** 配置 */
      ConfigToken: typeof ConfigToken;
      /** 保存资料的文件夹 */
      DirToken: typeof DirToken;
      /** 日志 */
      LogToken: typeof LogToken;
      RagWorkflowParser: typeof RagWorkflowParser;
      ContentParserToken: typeof ContentParserToken;
    };
    workflow: {
      NodeRunnerBase: typeof NodeRunnerBase;
    };
  };
}
export type ManifestFactoy = (config: ManifestInput) => ManifestReturnType;
