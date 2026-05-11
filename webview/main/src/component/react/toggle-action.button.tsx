import { Tooltip } from 'antd';

export function ToggleActionButton(props: {
  icon: string;
  onClick: () => void;
  title: string;
  disabledStatus?: boolean;
}) {
  return (
    <Tooltip title={props.title}>
      <div className="relative flex">
        {props.disabledStatus ? (
          <div className="material-icons cursor-pointer toolbar-icon  w-[24px] h-[24px] absolute top-0 right-0 bottom-0 left-0 z-[-1]">
            do_not_disturb
          </div>
        ) : null}
        <div
          className="material-icons cursor-pointer toolbar-icon  w-[24px] h-[24px]"
          onClick={props.onClick}
        >
          {props.icon}
        </div>
      </div>
    </Tooltip>
  );
}
