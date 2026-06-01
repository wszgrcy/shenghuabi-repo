import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  Injector,
  input,
  untracked,
} from '@angular/core';
import { actions, BaseControl, PiyingView } from '@piying/view-angular';
import { SelectorlessOutlet } from '@cyia/ngx-common/directive';
import * as v from 'valibot';
import { WorkflowInvalidConfig } from '@bridge/share';
import { ChatNodeService } from '../../../../domain/chat-node/chat-node.service';
import { createNoViewPiying } from '@fe/piying/no-view/create-instance';
import { renderConfig, setComponent } from '@piying/view-angular-core';
import { FieldGlobalConfig } from '../../../../page/workflow/define/field-global-config';
import { DivWC } from '@piying-lib/angular-core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { filter } from 'rxjs';

@Component({
  selector: 'app-invalid-form',
  templateUrl: './component.html',
  standalone: true,
  imports: [SelectorlessOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InvalidForm),
      multi: true,
    },
  ],
})
export class InvalidForm extends BaseControl {
  readonly PiyingView = PiyingView;
  readonly invalidConfigList = input<WorkflowInvalidConfig[]>();
  #chatNodeService = inject(ChatNodeService);
  context = inject(ChatNodeService).context;

  #options = {
    fieldGlobalConfig: {
      ...FieldGlobalConfig,
      wrappers: {
        ...FieldGlobalConfig.wrappers,
        'flow-handle': { type: DivWC },
        'use-ref': { type: DivWC },
      },
    },
    context: {
      ...this.context,
      setContextList: () => {},
    },
  };
  schema$$ = computed(() => {
    const list = this.invalidConfigList();
    if (!list || !list.length) {
      return;
    }
    return untracked(() => {
      const obj = {} as Record<string, any>;
      for (const item of list) {
        const tupleList: v.BaseSchema<any, any, any>[] = [];
        obj[item.id] = [];
        const config = this.#chatNodeService.fullNodeObject$$()[item.type];
        const define = config.configDefine!;
        const result = createNoViewPiying(define as any, this.#injector);
        for (const child of item.list) {
          const field = result.get(child.key)!;
          tupleList.push(
            v.object({
              key: v.pipe(
                v.optional(v.any(), child.key),
                setComponent(''),
                renderConfig({ hidden: true }),
              ),
              value: field.origin.sourceSchema,
            }),
          );
        }
        obj[item.id] = v.tuple(tupleList);
      }
      return v.pipe(
        v.object(obj as any),
        actions.hooks.merge({
          allFieldsResolved: (field) => {
            setTimeout(() => {
              field.form.root.valueChanges
                .pipe(filter(Boolean))
                .subscribe((value) => {
                  this.valueAndTouchedChange(value);
                });
            }, 0);
          },
        }),
      );
    });
  });
  inputs = {
    schema: this.schema$$,
    options: this.#options,
    model: this.value$,
    selectorless: true,
  };
  #injector = inject(Injector);
}
