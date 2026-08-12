import { TitleCasePipe } from '@angular/common';
import { AsyncPipe, DOCUMENT } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { PokemonListItem } from '../pokemon.service';
import { TcgCard, TcgdexService } from '../tcgdex.service';

interface CardCatalogState {
  status: 'loading' | 'success' | 'error';
  cards: TcgCard[];
}

@Component({
  selector: 'app-pokemon-grid',
  imports: [AsyncPipe, TitleCasePipe],
  templateUrl: './pokemon-grid.html',
  styleUrl: './pokemon-grid.scss',
})
export class PokemonGrid {
  private readonly tcgdex = inject(TcgdexService);
  private readonly document = inject(DOCUMENT);
  readonly pokemon = input.required<PokemonListItem[]>();
  readonly owner = input.required<string>();
  readonly ownedIds = input.required<ReadonlySet<number>>();
  readonly savingIds = input.required<ReadonlySet<number>>();
  readonly togglePokemon = output<PokemonListItem>();
  readonly selectedPokemon = signal<PokemonListItem | null>(null);
  readonly cardCatalog = signal<Observable<CardCatalogState> | null>(null);

  openCards(pokemon: PokemonListItem): void {
    this.selectedPokemon.set(pokemon);
    this.document.body.style.overflow = 'hidden';
    this.cardCatalog.set(this.tcgdex.getCardsByPokemon(pokemon.name).pipe(
      map((cards) => ({ status: 'success' as const, cards })),
      startWith({ status: 'loading' as const, cards: [] }),
      catchError(() => of({ status: 'error' as const, cards: [] })),
    ));
  }

  closeCards(): void {
    this.selectedPokemon.set(null);
    this.cardCatalog.set(null);
    this.document.body.style.overflow = '';
  }

  useFallbackImage(event: Event, pokemonId: number): void {
    const image = event.target as HTMLImageElement;
    const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

    if (image.src !== fallbackUrl) {
      image.src = fallbackUrl;
    }
  }

  useCardFallback(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
