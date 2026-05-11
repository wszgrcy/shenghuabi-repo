import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { TrpcService } from '@fe/trpc';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'help-search',
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatInputModule,
    MatAutocompleteModule,
    FormsModule,
    MatOptionModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpSearchComponent {
  #client = inject(TrpcService).client;

  searchOptions$ = signal<{ label: string; value: string }[]>([]);

  value = new Subject<string>();
  loading$ = signal(false);
  ngOnInit(): void {
    this.value
      .pipe(
        distinctUntilChanged(),
        tap(() => {
          this.loading$.set(true);
        }),
        debounceTime(500),
        switchMap((value) => {
          return this.#client.common.helpSearch.query(value);
        }),
      )
      .subscribe((list) => {
        this.loading$.set(false);
        this.searchOptions$.set(list);
      });
  }
  inputChange(value: string) {
    this.value.next(value);
  }
}
