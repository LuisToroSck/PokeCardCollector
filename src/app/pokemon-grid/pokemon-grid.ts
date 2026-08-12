import { TitleCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';
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
}
