import { NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { PiyingViewGroupBase } from '@piying/view-angular';

@Component({
  selector: 'cyia-expansion',
  templateUrl: './component.html',
  standalone: true,
  imports: [MatExpansionModule, NgTemplateOutlet],
})
export class ExpansionPanelFGC extends PiyingViewGroupBase {}
