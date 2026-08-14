import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, combineLatest, map, of, startWith } from 'rxjs';
import { ASH_POKEMON_IDS } from '../ash-pokemon.ids';
import { CollectionService } from '../collection.service';
import { PokemonGrid } from '../pokemon-grid/pokemon-grid';
import { PokemonListItem, PokemonService } from '../pokemon.service';

@Component({
  selector: 'app-ash',
  imports: [AsyncPipe, PokemonGrid, ReactiveFormsModule],
  templateUrl: './ash.html',
  styleUrls: ['../collection-page.scss'],
})
export class Ash {
  private readonly pokemonService = inject(PokemonService);
  private readonly collectionService = inject(CollectionService);

  readonly configuredIds = ASH_POKEMON_IDS;
  readonly search = new FormControl('', { nonNullable: true });
  readonly filter = new FormControl<'all' | 'owned' | 'missing'>('all', { nonNullable: true });
  readonly apiError = signal(false);
  readonly firestoreError = signal(false);
  readonly savingIds = signal<ReadonlySet<number>>(new Set());

  readonly vm$ = combineLatest([
    this.pokemonService.getPokemonByIds(this.configuredIds).pipe(
      catchError(() => { this.apiError.set(true); return of([]); }),
    ),
    this.search.valueChanges.pipe(startWith('')),
    this.filter.valueChanges.pipe(startWith('all' as const)),
    this.collectionService.watchOwned('luis-ash').pipe(
      catchError(() => { this.firestoreError.set(true); return of(new Set<number>()); }),
    ),
  ]).pipe(map(([allPokemon, term, filter, ownedIds]) => {
    const obtained = allPokemon.filter((pokemon) => ownedIds.has(pokemon.id)).length;
    return {
      ownedIds,
      obtained,
      total: allPokemon.length,
      percent: allPokemon.length ? Math.round((obtained / allPokemon.length) * 1000) / 10 : 0,
      pokemon: allPokemon.filter((pokemon) =>
        pokemon.name.includes(term.trim().toLowerCase()) &&
        (filter === 'all' || (filter === 'owned' ? ownedIds.has(pokemon.id) : !ownedIds.has(pokemon.id))),
      ),
    };
  }));

  toggleFilter(filter: 'owned' | 'missing'): void {
    this.filter.setValue(this.filter.value === filter ? 'all' : filter);
  }

  async togglePokemon(pokemon: PokemonListItem, ownedIds: ReadonlySet<number>): Promise<void> {
    this.firestoreError.set(false);
    this.savingIds.update((ids) => new Set(ids).add(pokemon.id));
    try {
      await this.collectionService.setOwned('luis-ash', pokemon, !ownedIds.has(pokemon.id));
    } catch {
      this.firestoreError.set(true);
    } finally {
      this.savingIds.update((ids) => { const next = new Set(ids); next.delete(pokemon.id); return next; });
    }
  }
}
