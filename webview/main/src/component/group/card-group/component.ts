import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, viewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PiyingViewGroupBase } from '@piying/view-angular';
@Component({
  selector: 'card-group',
  templateUrl: './component.html',
  imports: [MatCardModule, NgTemplateOutlet],
})
export class CardFGC extends PiyingViewGroupBase {
  static __version = 2;
  templateRef = viewChild.required('templateRef');
  childrenWrapperClass$$ = computed(() => {
    return this.field$$().props()['childrenWrapperClass'] ?? 'grid gap-2';
  });
}
