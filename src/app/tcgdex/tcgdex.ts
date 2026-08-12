import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, map, of, startWith } from 'rxjs';
import { TcgdexService } from '../tcgdex.service';

@Component({
  selector: 'app-tcgdex',
  imports: [AsyncPipe],
  templateUrl: './tcgdex.html',
  styleUrl: './tcgdex.scss',
})
export class Tcgdex {
  private readonly service = inject(TcgdexService);

  readonly state$ = this.service.getSeries().pipe(
    map((series) => ({ status: 'success' as const, series })),
    startWith({ status: 'loading' as const, series: [] }),
    catchError(() => of({ status: 'error' as const, series: [] })),
  );
}
