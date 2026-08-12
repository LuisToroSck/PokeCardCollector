import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface TcgSeries {
  id: string;
  name: string;
  logo?: string;
}

export interface TcgCard {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

@Injectable({ providedIn: 'root' })
export class TcgdexService {
  private readonly http = inject(HttpClient);
  private readonly spanishApiUrl = 'https://api.tcgdex.net/v2/es';
  private readonly englishApiUrl = 'https://api.tcgdex.net/v2/en';
  private seriesCache?: Observable<TcgSeries[]>;
  private readonly cardCache = new Map<string, Observable<TcgCard[]>>();

  getSeries(): Observable<TcgSeries[]> {
    this.seriesCache ??= this.http
      .get<TcgSeries[]>(`${this.spanishApiUrl}/series`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.seriesCache;
  }

  getCardsByPokemon(name: string): Observable<TcgCard[]> {
    const normalizedName = name.trim().toLowerCase();
    const cached = this.cardCache.get(normalizedName);
    if (cached) return cached;

    const params = new HttpParams()
      .set('name', normalizedName)
      .set('category', 'Pokemon')
      .set('sort:field', 'name')
      .set('sort:order', 'ASC');
    const request = this.http
      .get<TcgCard[]>(`${this.englishApiUrl}/cards`, { params })
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.cardCache.set(normalizedName, request);
    return request;
  }
}
