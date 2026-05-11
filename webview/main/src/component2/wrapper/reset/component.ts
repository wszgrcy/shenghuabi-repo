import {
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import {
  PI_VIEW_FIELD_TOKEN,
  InsertFieldDirective,
} from '@piying/view-angular';

@Component({
  selector: 'cyia-reset-wrapper',
  templateUrl: './component.html',
  standalone: true,
  imports: [InsertFieldDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldResetSuffixWrapper {
  suffixTemplate = viewChild('suffix');
  field$$ = inject(PI_VIEW_FIELD_TOKEN);
  ngAfterViewInit(): void {
    this.field$$().props.update((props) => {
      return { ...props, suffix: this.suffixTemplate() };
    });
  }
  resetValue() {
    this.field$$().form.control!.reset();
  }
}
