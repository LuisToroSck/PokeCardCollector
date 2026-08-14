import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { CollectionService } from '../collection.service';
import { PokemonGrid } from '../pokemon-grid/pokemon-grid';
import { PokemonListItem, PokemonService, REGIONS } from '../pokemon.service';

@Component({ selector: 'app-martin', imports: [AsyncPipe, PokemonGrid, ReactiveFormsModule], templateUrl: './martin.html', styleUrls: ['../collection-page.scss'] })
export class Martin {
  private readonly service = inject(PokemonService);
  private readonly collection = inject(CollectionService);
  private readonly regionSubject = new BehaviorSubject(REGIONS[1]);

  readonly regions = REGIONS;
  readonly search = new FormControl('', { nonNullable: true });
  readonly filter = new FormControl<'all' | 'owned' | 'missing'>('all', { nonNullable: true });
  readonly error = signal(false);
  readonly firestoreError = signal(false);
  readonly savingIds = signal<ReadonlySet<number>>(new Set());

  readonly vm$ = combineLatest([
    this.regionSubject.pipe(
      switchMap((region) => combineLatest([
        this.service.getLegendary(),
        this.service.getByGeneration(region.id),
      ]).pipe(
        map(([allLegendary, generationPokemon]) => {
          const generationIds = new Set(generationPokemon.map((pokemon) => pokemon.id));
          return {
            region,
            allLegendary,
            regionLegendary: allLegendary.filter((pokemon) => generationIds.has(pokemon.id)),
          };
        }),
        catchError(() => {
          this.error.set(true);
          return of({ region, allLegendary: [], regionLegendary: [] });
        }),
      )),
    ),
    this.search.valueChanges.pipe(startWith('')),
    this.filter.valueChanges.pipe(startWith('all' as const)),
    this.collection.watchOwned('martin').pipe(
      catchError(() => { this.firestoreError.set(true); return of(new Set<number>()); }),
    ),
  ]).pipe(map(([data, term, filter, ownedIds]) => {
    const regionOwned = data.regionLegendary.filter((pokemon) => ownedIds.has(pokemon.id)).length;
    const totalOwned = data.allLegendary.filter((pokemon) => ownedIds.has(pokemon.id)).length;

    return {
      region: data.region,
      ownedIds,
      regionOwned,
      regionTotal: data.regionLegendary.length,
      regionPercent: this.percentage(regionOwned, data.regionLegendary.length),
      totalOwned,
      total: data.allLegendary.length,
      totalPercent: this.percentage(totalOwned, data.allLegendary.length),
      pokemon: data.regionLegendary.filter((item) =>
        item.name.includes(term.trim().toLowerCase()) &&
        (filter === 'all' || (filter === 'owned' ? ownedIds.has(item.id) : !ownedIds.has(item.id))),
      ),
    };
  }));

  selectRegion(region: (typeof REGIONS)[number]): void {
    this.error.set(false);
    this.search.setValue('');
    this.regionSubject.next(region);
  }

  toggleFilter(filter: 'owned' | 'missing'): void {
    this.filter.setValue(this.filter.value === filter ? 'all' : filter);
  }

  async togglePokemon(pokemon: PokemonListItem, ownedIds: ReadonlySet<number>): Promise<void> {
    this.firestoreError.set(false);
    this.savingIds.update((ids) => new Set(ids).add(pokemon.id));
    try {
      await this.collection.setOwned('martin', pokemon, !ownedIds.has(pokemon.id));
    } catch {
      this.firestoreError.set(true);
    } finally {
      this.savingIds.update((ids) => { const next = new Set(ids); next.delete(pokemon.id); return next; });
    }
  }

  private percentage(obtained: number, total: number): number {
    return total ? Math.round((obtained / total) * 1000) / 10 : 0;
  }
}
