import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { PokemonGrid } from '../pokemon-grid/pokemon-grid';
import { PokemonService } from '../pokemon.service';

@Component({ selector: 'app-martin', imports: [AsyncPipe, PokemonGrid, ReactiveFormsModule], templateUrl: './martin.html', styleUrls: ['../collection-page.scss'] })
export class Martin {
  private readonly service = inject(PokemonService);
  readonly search = new FormControl('', { nonNullable: true });
  readonly error = signal(false);
  readonly pokemon$ = this.search.valueChanges.pipe(
    startWith(''),
    switchMap((term) => this.service.getLegendary().pipe(
      map((pokemon) => pokemon.filter((item) => item.name.includes(term.trim().toLowerCase()))),
      catchError(() => { this.error.set(true); return of([]); }),
    )),
  );
}
