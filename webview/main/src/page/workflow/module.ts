import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import WorkflowEditor from './component';

@NgModule({
  declarations: [],
  imports: [
    ReactiveFormsModule,
    RouterModule.forChild([
      { path: '', pathMatch: 'full', component: WorkflowEditor },
    ]),
  ],
  exports: [],
  providers: [],
})
export default class WorkflowModule {}
