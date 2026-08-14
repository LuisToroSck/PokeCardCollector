import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';

interface NamedResource { name: string; url: string; }
interface GenerationResponse { pokemon_species: NamedResource[]; }
interface ResourceCountResponse { count: number; }
interface LegendaryGraphqlResponse { data: { pokemon_species: { id: number; name: string }[] }; }

export interface PokemonListItem {
  id: number;
  name: string;
  imageUrl: string;
}

export interface RegionOption {
  id: number;
  name: string;
  generation: string;
}

export const REGIONS: RegionOption[] = [
  { id: 0, name: 'Todos', generation: 'Todas las generaciones' },
  { id: 1, name: 'Kanto', generation: 'Generación I' },
  { id: 2, name: 'Johto', generation: 'Generación II' },
  { id: 3, name: 'Hoenn', generation: 'Generación III' },
  { id: 4, name: 'Sinnoh', generation: 'Generación IV' },
  { id: 5, name: 'Unova', generation: 'Generación V' },
  { id: 6, name: 'Kalos', generation: 'Generación VI' },
  { id: 7, name: 'Alola', generation: 'Generación VII' },
  { id: 8, name: 'Galar', generation: 'Generación VIII' },
  { id: 9, name: 'Paldea', generation: 'Generación IX' },
];

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private readonly http = inject(HttpClient);
  private readonly restUrl = 'https://pokeapi.co/api/v2';
  private readonly graphqlUrl = 'https://graphql.pokeapi.co/v1beta2';
  private readonly generationCache = new Map<number, Observable<PokemonListItem[]>>();
  private legendaryCache?: Observable<PokemonListItem[]>;
  private speciesCountCache?: Observable<number>;
  private allGenerationsCache?: Observable<PokemonListItem[]>;

  getByGeneration(generationId: number): Observable<PokemonListItem[]> {
    if (generationId === 0) return this.getAllGenerations();

    const cached = this.generationCache.get(generationId);
    if (cached) return cached;

    const request = this.http.get<GenerationResponse>(`${this.restUrl}/generation/${generationId}`).pipe(
      map(({ pokemon_species }) => pokemon_species
        .map((pokemon) => this.toListItem(this.idFromUrl(pokemon.url), pokemon.name))
        .sort((a, b) => a.id - b.id)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.generationCache.set(generationId, request);
    return request;
  }

  private getAllGenerations(): Observable<PokemonListItem[]> {
    this.allGenerationsCache ??= forkJoin(
      REGIONS.filter((region) => region.id > 0).map((region) => this.getByGeneration(region.id)),
    ).pipe(
      map((generations) => generations.flat().sort((a, b) => a.id - b.id)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.allGenerationsCache;
  }

  getLegendary(): Observable<PokemonListItem[]> {
    if (this.legendaryCache) return this.legendaryCache;

    const query = `query SpecialPokemon {
      pokemon_species: pokemonspecies(
        where: {
          _or: [
            { is_legendary: { _eq: true } }
            { is_mythical: { _eq: true } }
          ]
        }
        order_by: { id: asc }
      ) {
        id
        name
      }
    }`;

    this.legendaryCache = this.http
      .post<LegendaryGraphqlResponse>(this.graphqlUrl, { query })
      .pipe(
        map(({ data }) => data.pokemon_species.map((pokemon) => this.toListItem(pokemon.id, pokemon.name))),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.legendaryCache;
  }

  getSpeciesCount(): Observable<number> {
    this.speciesCountCache ??= this.http
      .get<ResourceCountResponse>(`${this.restUrl}/pokemon-species?limit=1`)
      .pipe(
        map(({ count }) => count),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.speciesCountCache;
  }

  private toListItem(id: number, name: string): PokemonListItem {
    return {
      id,
      name,
      imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
    };
  }

  private idFromUrl(url: string): number {
    return Number(url.match(/pokemon-species\/(\d+)\/$/)?.[1] ?? 0);
  }
}
