import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { InsertFieldDirective } from '@piying/view-angular';
import {
  fieldControlStatusClass,
  getDeepError,
  PI_VIEW_FIELD_TOKEN,
} from '@piying/view-angular-core';
@Component({
  selector: 'alert-valid-wrapper',
  templateUrl: './component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './component.scss',
  imports: [NgTemplateOutlet, InsertFieldDirective],
})
export class AlertValidWrapper {
  field$$ = inject(PI_VIEW_FIELD_TOKEN);
  props$$ = computed(() => {
    return this.field$$().props();
  });
  position$$ = computed(() => {
    return this.props$$()['validPosition'] ?? 'top';
  });
  errorStr$$ = computed(() => {
    const field = this.field$$();
    return getDeepError(field.form.control);
  });
  classStatus$$ = computed(() => {
    return fieldControlStatusClass(this.field$$().form.control);
  });
  isChangedStatus$$ = computed(
    () =>
      this.field$$().form.control?.dirty$$() ||
      this.field$$().form.control?.touched$$(),
  );
}
