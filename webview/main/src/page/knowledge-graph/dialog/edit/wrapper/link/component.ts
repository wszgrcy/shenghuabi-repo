import { Component, computed, inject, viewChild } from '@angular/core';
import { InsertFieldDirective } from '@piying/view-angular';
import { PI_VIEW_FIELD_TOKEN } from '@piying/view-angular-core';

@Component({
  selector: 'app-link-wrapper',
  templateUrl: './component.html',
  imports: [InsertFieldDirective],
})
export class LinkWrapperComponent {
  static __version = 2;
  templateRef = viewChild.required('templateRef');
  field = inject(PI_VIEW_FIELD_TOKEN);
  props$$ = computed(() => {
    return this.field().props();
  });
  parent$$ = computed(() => {
    return this.field().get(['..'])!.props();
  });
  editable$$ = computed(() => {
    return this.parent$$()['editable'];
  });

  openOther(name: string, e: MouseEvent) {
    if (name) {
      this.field().context['openDialog'](name);
    }
    e.stopPropagation();
    e.preventDefault();
  }
}
