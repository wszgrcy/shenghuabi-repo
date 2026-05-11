import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import Page from './component';

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild([{ path: '', pathMatch: 'full', component: Page }]),
  ],
  exports: [],
  providers: [],
})
export default class KnowledgeQueryModule {}
