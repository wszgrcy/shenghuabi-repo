import { WebviewNodeConfig } from '@shenghuabi/workflow/share';
import { IterationNodeComponent } from './component';
import { BridgeService } from '../../service';
import { IterationStartNodeDefine } from '../iteration-start-node';
import { defaultConfigMerge } from '@fe/util/default-config-merge';

export const IterationNodeDefine: WebviewNodeConfig = {
  type: 'iteration',
  label: `迭代`,
  icon: { fontIcon: 'repeat' },
  disableHead: false,
  disableConnect: false,
  color: 'accent',
  help: [
    `### 用于处理列表数据`,
    `- 文件列表`,
    `- 知识库返回的数据`,
    `- 文章切片处理`,
    `- 其他数组类型的数据`,
    '### 节点操作',
    '- 将其他节点拖动到该节点中,表示在该节点内使用',
    '- 选择节点后右键`解除父级`可以在该节点外使用该节点',
    '- 节点内的`开始节点`表示列表中的迭代项出口',
  ].join('\n'),
  component: IterationNodeComponent,
  // config: knowledgeConfig,
  outputs: [[{ value: 'flat', label: '扁平数组' }]],
  initData: () => {
    return {
      data: {
        transform: {
          resizable: true,
        },

        value: [],
      },
      width: 400,
      height: 300,
    };
  },
  afterAdd: (node, injector) => {
    const bridge = injector.get(BridgeService);
    const type = IterationStartNodeDefine.type;
    const config = bridge.fullNodeObject$$()[type];
    bridge.appendNode(
      { x: 0, y: 0 },
      {
        ...defaultConfigMerge(config, config.config ?? config.displayConfig),
        type: type,
        extent: 'parent',
        parentId: node.id,
        // draggable: false,
        position: {
          x: +15,
          y: (node.height as number) * 0.5,
        },
      },
    );
  },
};
