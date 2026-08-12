import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { PokemonGrid } from '../pokemon-grid/pokemon-grid';
import { PokemonService, REGIONS } from '../pokemon.service';

@Component({ selector: 'app-luis', imports: [AsyncPipe, PokemonGrid, ReactiveFormsModule], templateUrl: './luis.html', styleUrls: ['../collection-page.scss'] })
export class Luis {
  private readonly service = inject(PokemonService);
  private readonly regionSubject = new BehaviorSubject(REGIONS[0]);
  readonly regions = REGIONS;
  readonly search = new FormControl('', { nonNullable: true });
  readonly error = signal(false);
  readonly vm$ = combineLatest([
    this.regionSubject.pipe(switchMap((region) => {
      this.error.set(false);
      return this.service.getByGeneration(region.id).pipe(
        map((pokemon) => ({ region, pokemon })),
        catchError(() => { this.error.set(true); return of({ region, pokemon: [] }); }),
      );
    })),
    this.search.valueChanges.pipe(startWith('')),
  ]).pipe(map(([data, term]) => ({ ...data, pokemon: data.pokemon.filter((item) => item.name.includes(term.trim().toLowerCase())) })));
  selectRegion(region: (typeof REGIONS)[number]): void { this.regionSubject.next(region); }
  retry(): void { this.regionSubject.next(this.regionSubject.value); }
}
