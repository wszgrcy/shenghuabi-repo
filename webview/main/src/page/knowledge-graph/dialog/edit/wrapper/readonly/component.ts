import { Component, computed, inject, viewChild } from '@angular/core';
import { InsertFieldDirective } from '@piying/view-angular';
import { PI_VIEW_FIELD_TOKEN } from '@piying/view-angular-core';

@Component({
  selector: 'app-readonly-wrapper',
  templateUrl: './component.html',
  imports: [InsertFieldDirective],
})
export class ReadonlyWrapperComponent {
  static __version = 2;
  templateRef = viewChild.required('templateRef');
  field = inject(PI_VIEW_FIELD_TOKEN);
  parent$$ = computed(() => {
    return this.field().get(['..'])!.props();
  });
  editable$$ = computed(() => {
    return this.parent$$()['editable'];
  });
}
