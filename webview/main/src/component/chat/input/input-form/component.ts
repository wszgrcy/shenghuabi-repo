import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SkipEnterDirective } from '../../../../directive/skip-enter.directive';
import { PurePipe } from '@cyia/ngx-common/pipe';
import {
  ChatInputType,
  CommonChatInput,
  deepClone,
  WebviewNodeConfig,
} from '@bridge/share';
import { ImageBase64InputComponent } from '@fe/component/image-base64-input/component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { uniq } from 'lodash-es';

import { MatTooltipModule } from '@angular/material/tooltip';
import { TrpcService } from '@fe/trpc';
import { ChatNodeService } from '../../../../domain/chat-node/chat-node.service';
import { YamlTextAreaFCC } from '@cyia/component/core';

@Component({
  selector: 'input-form',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    SkipEnterDirective,
    PurePipe,
    YamlTextAreaFCC,
    ImageBase64InputComponent,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFormComponent),
      multi: true,
    },
    ChatNodeService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFormComponent implements ControlValueAccessor {
  #trpc = inject(TrpcService);
  #dialog = inject(MatDialog);
  #injector = inject(Injector);
  /** 每个输入值的类型 */
  inputList = input<CommonChatInput[]>();
  #extraInput$ = signal<CommonChatInput[]>([]);
  inputList$$ = computed(() => {
    return uniq([...(this.inputList() || []), ...this.#extraInput$()]);
  });
  /** 复杂的一些参数 */
  context$$ = computed(() => {
    return this.value$().context;
  });
  switchObject: Record<string, boolean> = {};
  /** 如果从其他地方输入,那么禁用这个值不允许编辑 */
  disableInputObject = input.required<Record<string, boolean>>();
  /** 好像是回车直接对话,但是shift+回车就不对话 */
  keyEnter = output();
  onChange = (_: any) => {};
  value$ = signal<{ input: Record<string, any>; context: Record<string, any> }>(
    {
      input: {},
      context: {},
    },
  );
  inputValue$$ = computed(() => {
    return this.value$().input;
  });
  #nodeContextList$$ = computed(() => {
    return this.#chatNode.nodeList$().filter((item) => item.templateConfig);
  });
  #pluginNodeContextList$$ = computed(() => {
    return this.#chatNode
      .pluginNodeList$()
      .filter((item) => item.templateConfig);
  });
  fullContextList$$ = computed(() => {
    return [...this.#nodeContextList$$(), ...this.#pluginNodeContextList$$()];
  });
  #fullContextObject$$ = computed(() => {
    return this.fullContextList$$().reduce(
      (obj, item) => {
        obj[item.type] = item;
        return obj;
      },
      {} as Record<string, WebviewNodeConfig>,
    );
  });
  #chatNode = inject(ChatNodeService);
  constructor() {
    effect(() => {
      const context = this.context$$();
      untracked(() => {
        this.#extraInput$.set(
          Object.values(context)
            .flatMap(({ data }) => data.handle?.input.flat())
            .filter((item) => !!item && !item.type),
        );
      });
    });
    this.#trpc.client.workflow.getPluginNodeList.subscribe(undefined, {
      onData: async (list) => {
        const result = await Promise.all(
          list.map((item) => {
            return import(item.filePath)
              .then((configFn) => {
                // 左下角的自定义配置表单
                return configFn.default({});
              })
              .then((config) => {
                return { ...config, ...item.config };
              });
          }),
        );
        this.#chatNode.pluginNodeList$.set(result);
      },
    });
  }
  writeValue(obj: any): void {
    obj = deepClone(obj ?? {});
    obj.input ??= {};
    obj.context ??= {};
    this.value$.set(obj);
    this.switchObject = { ...this.value$().context };
  }

  registerOnTouched(fn: () => void): void {}

  registerOnChange(fn: (_: any) => any): void {
    this.onChange = fn;
  }
  valueChange(key: string, changeValue: string) {
    this.value$.update((data) => {
      data.input[key] = changeValue;
      return { ...data };
    });
    this.onChange(deepClone(this.value$()));
  }

  keypressEnter() {
    const valueList = Object.values(this.inputValue$$());
    if (
      valueList.length &&
      valueList.length >=
        (this.inputList()?.filter((a) => !a.optional)?.length || 0) &&
      valueList.every((item) => !!item)
    ) {
      this.keyEnter.emit();
    }
  }
  inputType = (
    item: CommonChatInput,
    switchObject: Record<string, boolean>,
  ): ChatInputType | 'context' => {
    const key = this.inputKey(item);
    if (switchObject[key]) {
      return 'context';
    }
    return typeof item === 'object' ? item.inputType : 'string';
  };
  inputKey = (item: CommonChatInput) => {
    return typeof item === 'object' ? item.value : item;
  };
  inputLabel = (item: CommonChatInput) => {
    return typeof item === 'object' ? item.label : item;
  };
  stopDefault(e: MouseEvent) {
    e.stopPropagation();
  }

  async switchType(key: string, type?: string) {
    type = this.value$().context[key]?.type || type;
    const { WorkflowNodeDialogComponent } = await import(
      '../context-select/component'
    );
    const ref = this.#dialog.open(WorkflowNodeDialogComponent, {
      injector: this.#injector,
      data: {
        config: this.#fullContextObject$$()[type!]!,
        data: this.value$().context[key],
      },
    });
    ref.afterClosed().subscribe((data) => {
      if (data) {
        this.switchObject = { ...this.switchObject, [key]: true };
        this.value$.update((value) => {
          value.context[key] = data;
          delete value.input[key];
          return deepClone(value);
        });
        this.onChange(deepClone(this.value$()));
      }
    });
  }
  contextLabel = (item: any, label: any) => {
    return `${item.type}:${label}`;
  };
  removeKey(key: string) {
    this.switchObject = { ...this.switchObject, [key]: false };
    this.value$.update((value) => {
      delete value.context[key];
      value.context = { ...value.context };
      return { ...value };
    });
    this.onChange(deepClone(this.value$()));
  }
}
