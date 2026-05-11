import { Type } from '@angular/core';
import { interpolateRgbBasisClosed } from 'd3-interpolate';
import { useCallback, useMemo } from 'react';
import {
  Handle,
  NodeResizeControl,
  NodeToolbar,
  Position,
  ReactFlowState,
  useReactFlow,
  useStore,
  useUpdateNodeInternals,
} from '@xyflow/react';
import { CustomNode } from '../type';
import { NodeHeadComponent } from './node-head/component';
import { BridgeService } from '../service';
import { Tooltip } from 'antd';
import { isValidConnection } from '../../../component/flow-base/flow-base.service';
import { flatFilterHandleList, HandleNode } from '@bridge/share';
import { uniqBy } from 'lodash-es';
import { ToggleActionButton } from '@fe/component/react/toggle-action.button';
import { Segmented } from 'antd';
import { deepEqual } from 'fast-equals';
import { NgOutletReact } from '../../../bridge/component-wrapper';
import * as v from 'valibot';
import {
  getSchemaByIssuePath,
  getSchemaMetadata,
} from '@piying/view-angular-core';
import { WarningTwoTone } from '@ant-design/icons';
import '@valibot/i18n/zh-CN';
import { createDiffHandle } from '@fe/util/react';

const colorInterpolate = interpolateRgbBasisClosed(['red', 'yellow']);
const outputColorInterpolate = interpolateRgbBasisClosed(['lime', 'teal']);
function getPosition(position: number, count: number) {
  return ((position + 1) / (count + 1)) * 100 + '%';
}
function NodeTooltip(props: { bridge: BridgeService; props: CustomNode }) {
  if (props.props.type === 'input-params') {
    const manualInput = !!props.props.data.config?.['manualInput'];
    return (
      <ToggleActionButton
        disabledStatus={manualInput}
        title={!manualInput ? '需要输入提示词' : '直接调用'}
        onClick={useCallback(() => {
          props.bridge.patchDataOne(props.props.id, {
            config: {
              ...props.props.data.config,
              manualInput: !props.props.data.config?.['manualInput'],
            },
          });
        }, [props.props.data.config])}
        icon={'send'}
      ></ToggleActionButton>
    );
  }
  return null;
}
function useWarnToolbar({
  props,
  bridge,
}: {
  bridge: BridgeService;
  props: CustomNode;
}) {
  const message = useMemo(() => {
    const type = props.type;
    const nodeMeta = bridge.fullNodeObject$$()[type!];
    if (!nodeMeta) {
      return;
    }
    const config = nodeMeta.config;
    if (!config) {
      return;
    }
    const result = v.safeParse(config, props, { lang: 'zh-CN' });
    if (!result.success) {
      const list: string[] = [];
      result.issues.forEach((issue) => {
        if (!issue.path) {
          return;
        }
        const schema = getSchemaByIssuePath(config as any, issue.path);
        if (!schema) {
          return;
        }
        const metadata = getSchemaMetadata(schema);
        // console.log(metadata, issue);
        list.push(`${metadata.title}: ${issue.message}`);
      });
      return list;
    }
    return;
  }, [props.data]);
  return message;
}
const selector = (a: ReactFlowState) =>
  a.nodes.filter((node) => node.selected).length;
function TopToolbar(props: { bridge: BridgeService; props: CustomNode }) {
  const disableOpenConfig = props.props.data.options?.disableOpenConfig;
  const excludeUsage = props.props.data.excludeUsage;
  const outputList = useMemo(
    () => flatFilterHandleList(props.props.data.handle?.output),
    [props.props.data.handle?.output],
  );
  const defaultDisableDisplayOutput = useMemo(() => {
    return (
      outputList.length === 1 ||
      props.bridge.fullNodeObject$$()[props.props.type!]?.nodeMode ===
        'condition'
    );
  }, [outputList.length, props.props.type]);
  const edges = useStore((state) => {
    return defaultDisableDisplayOutput
      ? []
      : state.edges.filter(({ source }) => source === props.props.id);
  }, deepEqual);
  const displayOutput = useMemo(() => {
    if (defaultDisableDisplayOutput) {
      return false;
    }
    const result = outputList.some(({ id }) =>
      edges.some((edge) => edge.sourceHandle === id),
    );
    return !result;
  }, [edges, outputList, defaultDisableDisplayOutput]);
  const options = useMemo(() => {
    if (!displayOutput) {
      return [];
    }
    return uniqBy(outputList, (item) => item.value).map((item, i) => {
      return {
        value: item.value,
        icon: (
          <Tooltip title={'选择出口:' + item.label}>
            <div
              style={{ color: outputColorInterpolate(i / outputList.length) }}
              className="material-icons toolbar-icon w-[24px] h-[24px]"
            >
              output
            </div>
          </Tooltip>
        ),
      };
    });
  }, [displayOutput, outputList]);
  const selectedLength = useStore(selector);
  const valueWarn = useWarnToolbar(props);
  const excludeFn = useCallback(() => {
    props.bridge.patchDataOne(props.props.id, {
      excludeUsage: !excludeUsage,
    });
  }, [excludeUsage]);
  const hiddenFn = useCallback(() => {
    props.bridge.patchDataOne(props.props.id, {
      options: {
        ...props.props.data.options,
        disableOpenConfig: !props.props.data.options?.disableOpenConfig,
      },
    });
  }, [props.props.data.options]);
  // 切换出口
  return (
    <NodeToolbar
      isVisible={valueWarn ? true : undefined}
      position={Position.Top}
      className="flex border-[1px] rounded-[4px] mat-elevation-z2  node-toolbar items-center select-none"
      onDoubleClickCapture={(e) => {
        e.stopPropagation();
      }}
    >
      {valueWarn ? (
        <>
          <Tooltip
            placement="top"
            title={
              <>
                {valueWarn.map((a, i) => (
                  <div key={i}>{a}</div>
                ))}
              </>
            }
            mouseEnterDelay={0}
            className="toolbar-icon select-none"
          >
            <WarningTwoTone twoToneColor={'#faad14'} />
          </Tooltip>
        </>
      ) : null}
      {/* 如果没有配置,那么这个参数应该被隐藏,比如纯节点 */}
      {selectedLength === 1 && props.props.selected ? (
        <>
          <ToggleActionButton
            disabledStatus={!disableOpenConfig}
            title={!disableOpenConfig ? '隐藏配置' : '显示配置'}
            onClick={hiddenFn}
            icon={'settings'}
          ></ToggleActionButton>
          <ToggleActionButton
            disabledStatus={!excludeUsage}
            title={!excludeUsage ? '排除此节点' : '包含此节点'}
            onClick={excludeFn}
            icon={'grain'}
          ></ToggleActionButton>
          {displayOutput ? (
            <Segmented<string>
              options={options}
              value={props.props.data.outputName}
              onChange={(value) => {
                props.bridge.patchDataOne(props.props.id, {
                  outputName: value,
                });
              }}
            />
          ) : null}
          <NodeTooltip props={props.props} bridge={props.bridge}></NodeTooltip>
        </>
      ) : null}
    </NodeToolbar>
  );
}
export function handleItemFactory(
  position: Position,
  type: 'target' | 'source',
) {
  return (props: {
    list: any[];
    index: number;

    handleNode: HandleNode;
  }) => {
    const percent = props.index / props.list.length;
    const { id, label } = props.handleNode;
    return (
      <div
        className={'absolute handle-wrapper-' + position}
        key={props.index}
        style={{ top: getPosition(props.index, props.list.length) }}
      >
        <Tooltip title={label} mouseEnterDelay={0} placement={position}>
          <div className="label-hint">
            <Handle
              type={type}
              id={id}
              position={position}
              style={{
                background: colorInterpolate(percent),
              }}
              isValidConnection={isValidConnection}
            ></Handle>
          </div>
        </Tooltip>
      </div>
    );
  };
}
export const LeftHandleItem = handleItemFactory(Position.Left, 'target');
export const RightHandleItem = handleItemFactory(Position.Right, 'source');

// 传入时,应该时componnet或者config
export function wrapControlNode(
  componentConfig: {
    component: Type<any>;
    otherInputs?: Record<string, any>;
  },
  bridge: BridgeService,
) {
  // todo 迁到上方

  return (props: CustomNode) => {
    const instance = useReactFlow();
    props = instance.getNode(props.id)!;
    const updateNode = useUpdateNodeInternals();
    const LeftDiffHandle = useMemo(
      () =>
        createDiffHandle<HandleNode>({
          diffCompareFn: (item) => item.id,
          diffWhen(preValue, currentValue, diffValue) {
            return bridge.instance()!.deleteElements({
              edges: bridge
                .edges()
                .filter((edge) =>
                  diffValue.some(
                    (handle) =>
                      handle.id === edge.targetHandle &&
                      props.id === edge.target,
                  ),
                ),
            });
          },
          afterBuild() {
            updateNode(props.id);
          },
          creatChild: (list, item, index) => {
            return (
              <LeftHandleItem
                list={list}
                index={index}
                handleNode={item}
                key={index}
              ></LeftHandleItem>
            );
          },
        }),
      [],
    );
    const RightDiffHandle = useMemo(
      () =>
        createDiffHandle<HandleNode>({
          diffCompareFn: (item) => item.id,
          diffWhen(preValue, currentValue, diffValue) {
            return bridge.instance()!.deleteElements({
              edges: bridge
                .edges()
                .filter((edge) =>
                  diffValue.some(
                    (handle) =>
                      handle.id === edge.sourceHandle &&
                      props.id === edge.source,
                  ),
                ),
            });
          },
          afterBuild() {
            updateNode(props.id);
          },
          creatChild: (list, item, index) => {
            return (
              <RightHandleItem
                list={list}
                index={index}
                handleNode={item}
                key={index}
              ></RightHandleItem>
            );
          },
        }),
      [],
    );

    return (
      <>
        <div
          className={useMemo(() => {
            return (
              'h-full  flex items-stretch custom-node-wrapper' +
              (props.data.excludeUsage ? ' workflow-exclude-useage' : '')
            );
          }, [props.data.excludeUsage])}
        >
          {props.data?.transform?.resizable ? (
            <NodeResizeControl
              shouldResize={(e, d) => {
                return !!props.data?.transform?.resizable;
              }}
              minWidth={props.data?.minSize?.width || 0}
              minHeight={props.data?.minSize?.height || 0}
              className="z-10"
            >
              <div className="absolute right-0 bottom-0 resize-handle material-icons pt-1 pr-1">
                open_in_full
              </div>
            </NodeResizeControl>
          ) : undefined}
          <TopToolbar props={props} bridge={bridge}></TopToolbar>
          <div className="w-full p-3 border-3 rounded-xl border-solid custom-node-component border-transparent box-border flex flex-col gap-2  relative">
            <div className="drag-hover-mask absolute top-0 right-0 left-0 bottom-0 pointer-events-none m-auto opacity-0">
              拖动到这里
            </div>
            {useMemo(
              () =>
                bridge.fullNodeObject$$()[props.type!]
                  ?.disableHead ? undefined : (
                  <NgOutletReact
                    component={NodeHeadComponent}
                    props={props}
                  ></NgOutletReact>
                ),
              [],
            )}
            <NgOutletReact
              component={componentConfig.component}
              props={props}
              otherInputs={componentConfig.otherInputs}
            ></NgOutletReact>
          </div>
          <LeftDiffHandle
            list={flatFilterHandleList(props.data.handle?.input)}
          />
          <RightDiffHandle
            list={flatFilterHandleList(props.data.handle?.output)}
          />
        </div>
      </>
    );
  };
}
