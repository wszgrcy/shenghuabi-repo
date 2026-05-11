import { Type } from '@angular/core';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { NgOutletReact } from '../../../bridge/component-wrapper';

export function wrapEdge(component: Type<any>) {
  return (data: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
      sourceX: data.sourceX,
      sourceY: data.sourceY,
      sourcePosition: data.sourcePosition,
      targetX: data.targetX,
      targetY: data.targetY,
      targetPosition: data.targetPosition,
      curvature: data.pathOptions?.curvature,
    });
    return (
      <>
        <BaseEdge
          id={data.id}
          path={edgePath}
          markerStart={data.markerStart}
          markerEnd={data.markerEnd}
          style={{ strokeWidth: 2 }}
        />
        <EdgeLabelRenderer>
          <div className="default-edge-label-renderer">
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                fontSize: 12,
                pointerEvents: 'all',
                zIndex: 1,
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
                pointerEvents: 'none',
                // zIndex: -1,
              }}
              className="absolute hover-container"
            ></div>
          </div>
        </EdgeLabelRenderer>
      </>
    );
  };
}
