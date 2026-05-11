import { Type } from '@angular/core';
import {
  Handle,
  HandleType,
  NodeResizer,
  Position,
  useNodeConnections,
} from '@xyflow/react';
import { isValidConnection } from '../../../component/flow-base/flow-base.service';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BridgeService } from '../service';
import { CustomNode } from './type';
import { NodeToolbar } from '@xyflow/react';
import { Tooltip } from 'antd';
import { CardMindNode, MindNode, STYLE_Transformer } from '@bridge/share';
import { AddonToolGroup } from './tooltip.define';
import { css } from '@emotion/css';
import { defaultsDeep } from 'lodash-es';
import { MIND_OPTIONS_CONTEXT } from '../config/react.define';
import { insertScopeSheet } from '@fe/util/insert-style';
import { NgOutletReact } from '../../../bridge/component-wrapper';
import * as v from 'valibot';
import { captureException } from '@sentry/angular';
import clsx from 'clsx';
export enum Direction {
  h = 'h',
  v = 'v',
}
const positionList = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];
export const REVERSE_POSITION_MAP = {
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
};

export const POSITION_DIRECTION = {
  [Position.Top]: Direction.v,
  [Position.Bottom]: Direction.v,
  [Position.Left]: Direction.h,
  [Position.Right]: Direction.h,
};
const directionList: HandleType[] = ['source', 'target'];

export function getNearestHandleId(id: string) {
  const list = id.split('-');
  const position = REVERSE_POSITION_MAP[list[0] as any as Position];
  const direction: HandleType = list[1] === 'source' ? 'target' : 'source';
  return `${position}-${direction}`;
}
function changeSubNodeStatus(
  /** 当前这个节点的id */
  props: MindNode & {
    positionAbsoluteX: number;
    /** position absolute x value */
    positionAbsoluteY: number;
  },
  bridge: BridgeService,
  list: ReturnType<typeof useNodeConnections>,
  /** 是否折叠 */ fold: boolean,
  position: Position,
) {
  const { id, positionAbsoluteX, positionAbsoluteY } = props;

  /** 可能的后代节点 */
  let nodeList = list
    .map((item) => bridge.nodesObj$()[item.target])
    .map((node) => {
      return [bridge.getAllDescent(node, 9999), node];
    })
    .flat(9999);

  nodeList = bridge.containerReplaceSubNode(props, nodeList);
  const IDList = nodeList.map((item) => item.id);
  bridge.instance()!.setNodes!((list) => {
    return list.map((node) => {
      node.data['fold'] ??= {};
      if (node.id === id) {
        node.data['fold'][position] = fold;
        if (fold) {
          node.data.__private ??= {};
          node.data.__private = {
            ...node.data.__private,
            positionAbsolute: {
              x: positionAbsoluteX,
              y: positionAbsoluteY,
            },
          };
        }
        return { ...node };
      } else if (IDList.includes(node.id)) {
        if (fold === false) {
          node.data['fold'][position] = fold;
          if (props.data.__private?.positionAbsolute && !node.parentId) {
            node.position = {
              x:
                node.position.x +
                positionAbsoluteX -
                props.data.__private.positionAbsolute.x,
              y:
                node.position.y +
                positionAbsoluteY -
                props.data.__private.positionAbsolute.y,
            };
          }
        }
        return { ...node, hidden: fold };
      }
      return node;
    });
  });
}
function directionTransform(position: Position) {
  switch (position) {
    case Position.Top:
      return { transform: 'rotate(-90deg)' };
    case Position.Right:
      return {};
    case Position.Bottom:
      return { transform: 'rotate(90deg)' };
    case Position.Left:
      return { transform: 'rotate(180deg)' };
  }
}

function useEdgeGroup(props: CustomNode, bridge: BridgeService) {
  const props$ = useRef(props);
  props$.current = props;
  return positionList
    .map((position) => {
      return useNodeConnections({
        handleType: 'source',
        handleId: `${position}-source`,
      });
    })
    .map((list, i) => {
      // todo fold其实应该时私有属性.不应该直接放到这里
      const FOLD = props.data?.fold?.[positionList[i]] as boolean;
      return useMemo(() => {
        const tooltipList = [];
        if (list.length) {
          tooltipList.push(
            <Tooltip title={FOLD ? '展开' : '折叠'} key={tooltipList.length}>
              <div
                style={directionTransform(positionList[i])}
                className="material-icons cursor-pointer toolbar-icon  w-[24px] h-[24px] "
                onClick={() => {
                  changeSubNodeStatus(
                    props$.current as any,
                    bridge,
                    list,
                    !FOLD,
                    positionList[i],
                  );
                }}
              >
                {FOLD ? 'keyboard_arrow_right' : 'keyboard_arrow_left'}
              </div>
            </Tooltip>,
          );
        }
        const AddonTool = AddonToolGroup[positionList[i]]?.[props.type];
        if (AddonTool) {
          tooltipList.push(
            <AddonTool
              key={tooltipList.length}
              props={props}
              bridge={bridge}
            ></AddonTool>,
          );
        }
        return tooltipList.length ? (
          <NodeToolbar
            key={i}
            position={positionList[i]}
            className="flex border-[1px] rounded-[4px] mat-elevation-z2  node-toolbar items-center"
            onDoubleClickCapture={(e) => {
              e.stopPropagation();
            }}
          >
            {tooltipList}
          </NodeToolbar>
        ) : null;
      }, [list, FOLD, (props as CardMindNode).data.status]);
    });
}
export function useThemeClass(bridge: BridgeService, props: MindNode) {
  const [themeClass, setThemeClass] = useState('');
  const theme = props.data.config?.theme;
  useEffect(() => {
    if (!theme) {
      return setThemeClass('');
    }
    bridge.client.mind.nodeTheme.getOne.query(theme).then((themeContent) => {
      setThemeClass(insertScopeSheet(themeContent));
    });
  }, [theme]);
  return themeClass;
}
export function wrapControlNode(component: Type<any>, bridge: BridgeService) {
  return (props: CustomNode) => {
    /** 连接点列表.常驻 */
    const handleList = useMemo(
      () =>
        positionList.flatMap((position, i) => {
          return directionList.map((direction, j) => {
            return (
              <Handle
                key={`${i}-${j}`}
                type={direction}
                id={`${position}-${direction}`}
                position={position}
                isValidConnection={isValidConnection}
                onClick={() => {
                  if (
                    !bridge.globalConfig().options.clickGenerate ||
                    direction === 'target'
                  ) {
                    return;
                  }
                  bridge.targetClick$.set({
                    id: props.id,
                    handleId: `${position}-${direction}`,
                    position: position,
                  });
                }}
              >
                {<div className="click-add material-icons">add</div>}
              </Handle>
            );
          });
        }),
      [props.id],
    );
    const toolbar = useEdgeGroup(props, bridge);
    const globalStyle = useContext(MIND_OPTIONS_CONTEXT);

    return (
      <>
        <div className="h-full  flex items-stretch">
          <NodeResizer
            isVisible={
              !!props.selected &&
              (!!props.data?.transform?.resizable ||
                !!props.data?.transform?.display)
            }
            shouldResize={(e, d) => {
              return !!props.data?.transform?.resizable;
            }}
            minWidth={props.data?.minSize?.width || 0}
            minHeight={props.data?.minSize?.height || 0}
          ></NodeResizer>
          {toolbar}
          <div className={'node-wrapper w-full'}>
            <NgOutletReact
              component={component}
              props={props}
              className={clsx(
                useMemo(() => {
                  const result = v.safeParse(
                    STYLE_Transformer,
                    props.data.style,
                  );
                  if (result.success) {
                    return css(defaultsDeep(result.output, globalStyle));
                  } else {
                    captureException(
                      new Error('节点样式解析失败', { cause: result.issues }),
                    );
                  }
                  return '';
                }, [props.data.style, globalStyle]),
                'box-border',
                useThemeClass(bridge, props),
              )}
            ></NgOutletReact>
          </div>
          {handleList}
        </div>
      </>
    );
  };
}
