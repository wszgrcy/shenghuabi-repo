import { CardMindNode, MindNode } from '@bridge/share';
import { Tooltip } from 'antd';
import { FunctionComponent } from 'react';
import { BridgeService } from '../service';
import { Segmented } from 'antd';

const cardOpenStatusList = [
  {
    value: 'full',
    icon: (
      <Tooltip title={'显示所有'}>
        <div className="material-icons  icon-6">wysiwyg</div>
      </Tooltip>
    ),
  },
  {
    value: 'title',
    icon: (
      <Tooltip title={'显示标题'}>
        <div className="material-icons  icon-6">short_text</div>
      </Tooltip>
    ),
  },
  {
    value: 'content',
    icon: (
      <Tooltip title={'显示内容'}>
        <div className="material-icons  icon-6">notes</div>
      </Tooltip>
    ),
  },
];
function ToggleActionButton(props: {
  icon: string;
  onClick: () => void;
  title: string;
  disabledStatus?: boolean;
}) {
  return (
    <Tooltip title={props.title}>
      <div className="relative flex">
        {props.disabledStatus ? (
          <div className="material-icons cursor-pointer   icon-6 absolute top-0 right-0 bottom-0 left-0 z-[-1]">
            do_not_disturb
          </div>
        ) : null}
        <div
          className="material-icons cursor-pointer   icon-6"
          onClick={props.onClick}
        >
          {props.icon}
        </div>
      </div>
    </Tooltip>
  );
}
export const AddonToolGroup: Partial<
  Record<
    'left' | 'right' | 'top' | 'bottom',
    Record<
      string,
      FunctionComponent<{ props: MindNode; bridge: BridgeService }>
    >
  >
> = {
  top: {
    card: ({ props, bridge }) => {
      const status = (props as CardMindNode).data.status?.open ?? 'full';
      const isReadonly = (props as CardMindNode).data.status?.readonly;
      const displayFirst =
        (props as CardMindNode).data.status?.editorInteractionMode ===
        'displayFirst';
      return (
        <>
          <Segmented<string>
            options={cardOpenStatusList}
            value={status}
            onChange={(value) => {
              bridge.sendEvent(props.id, 'togglePanel', [value]);
            }}
          />

          <ToggleActionButton
            title={displayFirst ? '操作优先' : '显示优先'}
            onClick={() => {
              bridge.sendEvent(props.id, 'setEditorInteractionMode', [
                displayFirst ? 'full' : 'displayFirst',
              ]);
            }}
            disabledStatus={!displayFirst}
            icon={'drag_indicator'}
          ></ToggleActionButton>
          <ToggleActionButton
            title={isReadonly ? '编辑' : '只读'}
            onClick={() => {
              bridge.sendEvent(props.id, 'setReadonly', [!isReadonly]);
            }}
            disabledStatus={!isReadonly}
            icon={'edit'}
          ></ToggleActionButton>

          <Tooltip title="复制Markdown">
            <div
              className="material-icons cursor-pointer   icon-6 "
              onClick={() => {
                bridge.sendEvent(props.id, 'copyMarkdown');
              }}
            >
              content_copy
            </div>
          </Tooltip>
          <Tooltip title="最大化">
            <div
              className="material-icons cursor-pointer   icon-6 "
              onClick={() => {
                bridge.sendEvent(props.id, 'max');
              }}
            >
              crop_free
            </div>
          </Tooltip>
        </>
      );
    },
  },
};
