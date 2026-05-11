import { Type } from '@angular/core';
import { useContext, useMemo } from 'react';
import {
  Handle,
  HandleType,
  NodeResizer,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react';
import { isValidConnection } from '../../../component/flow-base/flow-base.service';
import { BridgeService } from '../service';
import {
  ChatMindNode,
  flatFilterHandleList,
  HandleNode,
  STYLE_Transformer,
} from '@bridge/share';
import { MIND_OPTIONS_CONTEXT } from '../config/react.define';
import { css } from '@emotion/css';
import { defaultsDeep } from 'lodash-es';
import { useThemeClass } from './wrap-node';
import { NgOutletReact } from '../../../bridge/component-wrapper';
import { LeftHandleItem } from '../../workflow/custom-node/wrap-node';
import * as v from 'valibot';
import { createDiffHandle } from '@fe/util/react';

const positionList = [Position.Right, Position.Bottom];
const directionList: HandleType[] = ['source'];
const SourceList = positionList.flatMap((position, i) => {
  return directionList.map((direction, j) => {
    return (
      <Handle
        key={`${i}-${j}`}
        type={direction}
        id={`${position}-${direction}`}
        position={position}
        isValidConnection={isValidConnection}
      ></Handle>
    );
  });
});

export function wrapControlNodeDynamic(
  component: Type<any>,
  bridge: BridgeService,
) {
  return (props: ChatMindNode) => {
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
    const instance = useReactFlow();
    props = instance.getNode(props.id)! as any;
    const globalStyle = useContext(MIND_OPTIONS_CONTEXT);

    return (
      <>
        <div className="h-full flex items-stretch">
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

          <div
            className={
              useMemo(
                () =>
                  css(
                    defaultsDeep(
                      v.parse(STYLE_Transformer, props.data.style),
                      globalStyle,
                    ),
                  ),
                [props.data.style, globalStyle],
              ) +
              ' node-wrapper w-full box-border ' +
              useThemeClass(bridge, props)
            }
          >
            <NgOutletReact component={component} props={props}></NgOutletReact>
          </div>
          <LeftDiffHandle
            list={flatFilterHandleList(props.data.handle?.input as any)}
          />
          {SourceList}
        </div>
      </>
    );
  };
}
