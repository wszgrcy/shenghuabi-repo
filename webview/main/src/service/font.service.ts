import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  filter,
  finalize,
  fromEvent,
  merge,
  of,
  switchMap,
  take,
} from 'rxjs';
const HANI = /^\p{Script=Hani}+$/u;
@Injectable({
  providedIn: 'root',
})
export class FontService {
  #inited$$ = new BehaviorSubject(false);

  getFontList() {
    return merge(
      of(document.visibilityState === 'visible').pipe(filter(Boolean)),
      fromEvent(document, 'visibilitychange'),
      this.#inited$$.pipe(filter(Boolean)),
    ).pipe(
      take(1),
      finalize(() => {
        this.#inited$$.next(true);
      }),
      switchMap(() => {
        return this.#getFontList();
      }),
    );
  }
  // 字体未知
  async #getFontList() {
    if ((window as any)['queryLocalFonts']) {
      const availableFonts: FontData[] = await (
        (window as any).queryLocalFonts as () => any
      )();
      return availableFonts.sort((a, b) => {
        const zh1 = HANI.test(a.fullName);
        if (zh1 && HANI.test(b.fullName)) {
          return a.fullName > b.fullName ? 1 : -1;
        }
        return zh1 ? -1 : 1;
      });
    }
    return [];
  }
}
