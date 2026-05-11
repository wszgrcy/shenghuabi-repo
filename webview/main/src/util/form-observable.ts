import { AbstractControl } from '@angular/forms';
import { filter, merge, of } from 'rxjs';

export function formControlObservable(
  input: AbstractControl,
  nonNullable: boolean = false,
) {
  return merge(of(input.value), input.valueChanges).pipe(
    filter((item) => {
      return nonNullable ? item != null : true;
    }),
  );
}
