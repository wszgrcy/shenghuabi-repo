import { Type } from '@angular/core';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useStore,
} from '@xyflow/react';
import { Direction, POSITION_DIRECTION } from './wrap-node';
import { NgOutletReact } from '../../../bridge/component-wrapper';
type GetSpecialPathParams = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};
function twoBezierOffset(
  t: number,
  p1: [number, number],
  cp: [number, number],
  p2: [number, number],
) {
  const [x1, y1] = p1;
  const [cx, cy] = cp;
  const [x2, y2] = p2;
  const x = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * cx + t * t * x2;
  const y = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * cy + t * t * y2;
  return [x, y] as const;
}
export const getSpecialPath = (
  { sourceX, sourceY, targetX, targetY }: GetSpecialPathParams,
  offset: number,
  direction: Direction,
) => {
  const isPositive =
    direction === Direction.h ? sourceX > targetX : sourceY > targetY;
  offset = isPositive ? offset : -offset;
  const centerX =
    (sourceX + targetX) / 2 + (direction === Direction.v ? offset : 0);
  const centerY =
    (sourceY + targetY) / 2 + (direction === Direction.h ? offset : 0);

  return [
    `M ${sourceX} ${sourceY} Q ${centerX} ${centerY} ${targetX} ${targetY}`,
    ...twoBezierOffset(
      0.5,
      [sourceX, sourceY],
      [centerX, centerY],
      [targetX, targetY],
    ),
  ] as const;
};

export function wrapEdge(component: Type<any>) {
  return (data: EdgeProps) => {
    let edgePath: string;
    let labelX: number;
    let labelY: number;
    const { target, source, targetPosition, sourcePosition } = data;
    const maybeOtherEdge = useStore((s) => {
      const edgeExists = s.edges.filter(
        (e) => e.source === target && e.target === source,
      );
      return edgeExists.some((edge) => {
        return (
          edge.sourceHandle?.split('-')[0] === targetPosition &&
          edge.targetHandle?.split('-')[0] === sourcePosition
        );
      });
    });
    if (maybeOtherEdge) {
      [edgePath, labelX, labelY] = getSpecialPath(
        {
          sourceX: data.sourceX,
          sourceY: data.sourceY,
          targetX: data.targetX,
          targetY: data.targetY,
        },
        50,
        POSITION_DIRECTION[data.sourcePosition],
      );
    } else {
      [edgePath, labelX, labelY] = getBezierPath({
        sourceX: data.sourceX,
        sourceY: data.sourceY,
        sourcePosition: data.sourcePosition,
        targetX: data.targetX,
        targetY: data.targetY,
        targetPosition: data.targetPosition,
        curvature: data.pathOptions?.curvature,
      });
    }
    return (
      <>
        <BaseEdge
          id={data.id}
          path={edgePath}
          markerStart={data.markerStart}
          markerEnd={data.markerEnd}
          style={data.style}
        />
        <EdgeLabelRenderer>
          <div className="default-edge-label-renderer ">
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                fontSize: 12,
                pointerEvents: 'all',
              }}
              className="nodrag nopan  "
            >
              <NgOutletReact component={component} props={data}></NgOutletReact>
            </div>
            <div
              style={{
                left: Math.min(data.sourceX, data.targetX),
                top: Math.min(data.sourceY, data.targetY),
                width: Math.abs(data.sourceX - data.targetX),
                height: Math.abs(data.sourceY - data.targetY),
                pointerEvents: 'all',
              }}
              className="absolute hover-container z-[-1]"
            ></div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  };
}
