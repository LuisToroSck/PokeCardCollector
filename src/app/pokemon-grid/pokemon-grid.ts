import { TitleCasePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { PokemonListItem } from '../pokemon.service';

@Component({
  selector: 'app-pokemon-grid',
  imports: [TitleCasePipe],
  templateUrl: './pokemon-grid.html',
  styleUrl: './pokemon-grid.scss',
})
export class PokemonGrid {
  readonly pokemon = input.required<PokemonListItem[]>();
  readonly owner = input.required<string>();
  readonly ownedIds = input.required<ReadonlySet<number>>();
  readonly savingIds = input.required<ReadonlySet<number>>();
  readonly togglePokemon = output<PokemonListItem>();

  useFallbackImage(event: Event, pokemonId: number): void {
    const image = event.target as HTMLImageElement;
    const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

    if (image.src !== fallbackUrl) {
      image.src = fallbackUrl;
    }
  }
}
