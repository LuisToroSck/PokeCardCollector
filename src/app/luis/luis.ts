import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { CollectionService } from '../collection.service';
import { PokemonGrid } from '../pokemon-grid/pokemon-grid';
import { PokemonListItem, PokemonService, REGIONS } from '../pokemon.service';

@Component({ selector: 'app-luis', imports: [AsyncPipe, PokemonGrid, ReactiveFormsModule], templateUrl: './luis.html', styleUrls: ['../collection-page.scss'] })
export class Luis {
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
    this.regionSubject.pipe(switchMap((region) => {
      this.error.set(false);
      return this.service.getByGeneration(region.id).pipe(
        map((pokemon) => ({ region, pokemon })),
        catchError(() => { this.error.set(true); return of({ region, pokemon: [] }); }),
      );
    })),
    this.search.valueChanges.pipe(startWith('')),
    this.filter.valueChanges.pipe(startWith('all' as const)),
    this.service.getSpeciesCount().pipe(catchError(() => of(1025))),
    this.collection.watchOwned('luis').pipe(
      catchError(() => { this.firestoreError.set(true); return of(new Set<number>()); }),
    ),
  ]).pipe(map(([data, term, filter, speciesCount, ownedIds]) => {
    const regionOwned = data.pokemon.filter((item) => ownedIds.has(item.id)).length;
    return {
      ...data,
      ownedIds,
      regionOwned,
      regionTotal: data.pokemon.length,
      regionPercent: this.percentage(regionOwned, data.pokemon.length),
      totalOwned: ownedIds.size,
      totalCount: speciesCount,
      totalPercent: this.percentage(ownedIds.size, speciesCount),
      pokemon: data.pokemon.filter((item) =>
        item.name.includes(term.trim().toLowerCase()) &&
        (filter === 'all' || (filter === 'owned' ? ownedIds.has(item.id) : !ownedIds.has(item.id))),
      ),
    };
  }));

  selectRegion(region: (typeof REGIONS)[number]): void {
    this.search.setValue('');
    this.regionSubject.next(region);
  }
  retry(): void { this.regionSubject.next(this.regionSubject.value); }
  toggleFilter(filter: 'owned' | 'missing'): void {
    this.filter.setValue(this.filter.value === filter ? 'all' : filter);
  }

  async togglePokemon(pokemon: PokemonListItem, ownedIds: ReadonlySet<number>): Promise<void> {
    this.firestoreError.set(false);
    this.savingIds.update((ids) => new Set(ids).add(pokemon.id));
    try {
      await this.collection.setOwned('luis', pokemon, !ownedIds.has(pokemon.id));
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
