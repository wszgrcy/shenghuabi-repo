import { Routes } from '@angular/router';
import { WebviewPage } from '@bridge/share';
export const routes: Routes = [
  // {
  //   path: WebviewPage.main,
  //   loadComponent: () => import('../page/main/component'),
  // },
  // 现在还不支持
  // {
  //   path: WebviewPage.richEditor,
  //   loadComponent: () => import('../page/rich-editor/component'),
  // },
  {
    path: WebviewPage.mind,
    loadComponent: () => import('../page/mind/component'),
  },
  {
    path: WebviewPage.ttsEditor,
    loadComponent: () => import('../page/tts-editor/component'),
  },
  {
    path: WebviewPage.aiChat,
    loadComponent: () => import('../page/ai-chat/component'),
  },
  {
    path: WebviewPage.knowledgeCreate,
    loadComponent: () => import('../page/knowledge-create/component'),
  },
  {
    path: WebviewPage.dictImport,
    loadComponent: () => import('../page/dict-import/component'),
  },
  {
    path: WebviewPage.environmentConfiguration,
    loadComponent: () => import('../page/environment-configuration/component'),
  },
  {
    path: WebviewPage.markdown,
    loadComponent: () => import('../page/markdown/component'),
  },
  {
    path: WebviewPage.workflow,
    loadChildren: () => import('../page/workflow/module'),
  },
  {
    path: WebviewPage.knowledgeQuery,
    loadComponent: () => import('../page/knowledge-query/component'),
  },
  {
    path: WebviewPage.idAsset,
    loadChildren: () => import('../page/id-asset/module'),
  },
  {
    path: WebviewPage.quickPick,
    loadComponent: () => import('../page/quick-pick/component'),
  },
  {
    path: WebviewPage.knowledgeGraph,
    loadComponent: () => import('../page/knowledge-graph/component'),
  },

  {
    path: WebviewPage.knowledgeConfigEdit,
    loadChildren: () => import('../page/knowledge-configEdit/module'),
  },
  {
    path: WebviewPage.pluginConfig,
    loadComponent: () => import('../page/plugin-config/component'),
  },
];
