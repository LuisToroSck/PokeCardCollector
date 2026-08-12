import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, combineLatest, map, of, startWith } from 'rxjs';
import { CollectionService } from '../collection.service';
import { PokemonGrid } from '../pokemon-grid/pokemon-grid';
import { PokemonListItem, PokemonService } from '../pokemon.service';

@Component({ selector: 'app-martin', imports: [AsyncPipe, PokemonGrid, ReactiveFormsModule], templateUrl: './martin.html', styleUrls: ['../collection-page.scss'] })
export class Martin {
  private readonly service = inject(PokemonService);
  private readonly collection = inject(CollectionService);
  readonly search = new FormControl('', { nonNullable: true });
  readonly filter = new FormControl<'all' | 'owned' | 'missing'>('all', { nonNullable: true });
  readonly error = signal(false);
  readonly firestoreError = signal(false);
  readonly savingIds = signal<ReadonlySet<number>>(new Set());

  readonly vm$ = combineLatest([
    this.service.getLegendary().pipe(catchError(() => { this.error.set(true); return of([]); })),
    this.search.valueChanges.pipe(startWith('')),
    this.filter.valueChanges.pipe(startWith('all' as const)),
    this.collection.watchOwned('martin').pipe(
      catchError(() => { this.firestoreError.set(true); return of(new Set<number>()); }),
    ),
  ]).pipe(map(([pokemon, term, filter, ownedIds]) => ({
    ownedIds,
    pokemon: pokemon.filter((item) =>
      item.name.includes(term.trim().toLowerCase()) &&
      (filter === 'all' || (filter === 'owned' ? ownedIds.has(item.id) : !ownedIds.has(item.id))),
    ),
  })));

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
}
