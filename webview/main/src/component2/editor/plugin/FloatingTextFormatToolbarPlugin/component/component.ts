import { Component, computed, inject, Injector, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CardEditorService } from '../../../card-editor.service';
import {
  $getSelection,
  BaseSelection,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  TextFormatType,
} from 'lexical';
import { PurePipe } from '@cyia/ngx-common/pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { deepEqual } from 'fast-equals';
import { OverlayModule } from '@angular/cdk/overlay';
import { FormsModule } from '@angular/forms';
// import { DropDownColorComponent } from '../../../ui/dropdown-color/component';
import { $patchStyleText } from '@lexical/selection';
import { PiyingView } from '@piying/view-angular';
import { FieldGlobalConfig } from '@fe/form/default-type-config';
import * as v from 'valibot';
import { SelectorlessOutlet } from '@cyia/ngx-common/directive';
import { safeDefine } from '@fe/piying/define';
import { filter } from 'rxjs';
export const BACKGROUND_COLOR_LIST = [
  '#ff1300',
  '#EC7878',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#0070FF',
  '#03A9F4',
  '#00BCD4',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFE500',
  '#FFBF00',
  '#FF9800',
  '#795548',
  '#9E9E9E',
  '#5A5A5A',
  '#FFFFFF',
];
interface ToolbarOptions {
  selection: BaseSelection;
  blockType: string;
  editor: LexicalEditor;
  status: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    subscript: boolean;
    superscript: boolean;
    code: boolean;
    pluginData: Record<string, any>;
  };
  value: {
    color: string;
    backgroundColor: string;
  };
}
@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    PurePipe,
    MatTooltipModule,
    MatMenuModule,
    OverlayModule,
    FormsModule,
    // DropDownColorComponent,
    // ChatToolbarComponent,
    SelectorlessOutlet,
  ],
  styleUrl: './component.scss',
})
export class EditorToolbarComponent {
  props = input.required<ToolbarOptions>();
  status$ = computed(() => this.props().status, { equal: deepEqual });
  service = inject(CardEditorService);
  selectedData = (type: string) => {
    return this.service.convertList$().find((item) => item.type === type);
  };
  injector = inject(Injector);
  #editor$$ = computed(() => this.props().editor);
  toolOptions$$ = computed(() => {
    return { editor: this.#editor$$(), injector: this.injector };
  });
  readonly formatTextList = [
    { icon: 'format_bold', payload: 'bold' as const },
    { icon: 'format_italic', payload: 'italic' as const },
    { icon: 'format_underlined', payload: 'underline' as const },
    { icon: 'strikethrough_s', payload: 'strikethrough' as const },
    { icon: 'subscript', payload: 'subscript' as const },
    { icon: 'superscript', payload: 'superscript' as const },
    { icon: 'code', payload: 'code' as const },
  ];
  readonly PiyingView = PiyingView;

  options = {
    fieldGlobalConfig: FieldGlobalConfig,
  };
  schema = v.object({
    color: v.pipe(
      v.string(),
      safeDefine.setComponent('autocomplete', (actions) => {
        return [
          actions.inputs.patch({ type: 'color', allowCustom: true }),
          actions.attributes.patch({
            class: 'min-w-[96px] min-h-[48px] p-0 border-0 cursor-pointer',
          }),
          actions.inputs.patchAsync({
            options: (field) => {
              return BACKGROUND_COLOR_LIST.map((item) => ({
                value: item,
              }));
            },
          }),
          actions.wrappers.patch([
            {
              type: 'div',
              attributes: {
                class: 'btn btn-circle btn-ghost overflow-hidden ',
              },
            },
          ]),
          actions.hooks.merge({
            allFieldsResolved: (field) => {
              field.form
                .control!.valueChanges.pipe(
                  filter(() => {
                    return (
                      field.form.control!.touched || field.form.control!.dirty
                    );
                  }),
                )
                .subscribe((value) => {
                  this.colorValueChange(value, 'color');
                });
            },
          }),
        ];
      }),
    ),
    backgroundColor: v.pipe(
      v.string(),
      safeDefine.setComponent('autocomplete', (actions) => {
        return [
          actions.inputs.patch({ type: 'color', allowCustom: true }),
          actions.attributes.patch({
            class: 'min-w-[96px] min-h-[48px] p-0 border-0 cursor-pointer',
          }),
          actions.inputs.patchAsync({
            options: (field) => {
              return BACKGROUND_COLOR_LIST.map((item) => ({
                value: item,
              }));
            },
          }),
          actions.wrappers.patch([
            {
              type: 'div',
              attributes: {
                class: 'btn btn-circle btn-ghost overflow-hidden ',
              },
            },
          ]),
          actions.hooks.merge({
            allFieldsResolved: (field) => {
              field.form
                .control!.valueChanges.pipe(
                  filter(() => {
                    return (
                      field.form.control!.touched || field.form.control!.dirty
                    );
                  }),
                )
                .subscribe((value) => {
                  this.colorValueChange(value, 'background-color');
                });
            },
          }),
        ];
      }),
    ),
  });
  piyingInput = () => {
    return {
      schema: this.schema,
      options: this.options,
      selectorless: true,
      model: computed(() => {
        return this.props().value;
      }),
    };
  };
  // readonly COLOR_LIST = BACKGROUND_COLOR_LIST;
  // readonly BACKGROUND_COLOR_LIST = BACKGROUND_COLOR_LIST;
  opend = true;
  selectionContent$ = computed(() => {
    return this.props().editor.read(
      () => this.props().selection?.getTextContent() || '',
    );
  });

  formatText(payload: TextFormatType) {
    this.props().editor.dispatchCommand(FORMAT_TEXT_COMMAND, payload);
  }
  insertLink() {}
  colorValueChange(value: string, type: 'color' | 'background-color') {
    this.props().editor.update(() => {
      $patchStyleText($getSelection()!, { [type]: value });
    });
  }
  contentChange(value: string) {
    this.props().editor.update(() => {
      // todo 可能是选中过时了,需要一种方法实时刷新选中
      const selection = $getSelection();
      selection?.insertText(value);
    });
  }
  pluginTool$$ = computed(() => {
    return this.service.plugins().map((item) => {
      return item.floatTool
        ? {
            name: item.name,
            tools: item.floatTool(),
          }
        : undefined;
    });
  });
}
