import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { PokemonListItem } from './pokemon.service';

export type CollectionOwner = 'luis' | 'martin' | 'luis-ash';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly firebase = inject(FirebaseService);
  private readonly streams = new Map<CollectionOwner, Observable<ReadonlySet<number>>>();

  watchOwned(owner: CollectionOwner): Observable<ReadonlySet<number>> {
    const cached = this.streams.get(owner);
    if (cached) return cached;

    const stream = new Observable<ReadonlySet<number>>((subscriber) => {
      let active = true;
      let stopListening: (() => void) | undefined;

      Promise.all([this.firebase.firestore, import('firebase/firestore')])
        .then(([firestore, { collection, onSnapshot }]) => {
          if (!active) return;
          const pokemonCollection = collection(firestore, 'collections', owner, 'pokemon');
          stopListening = onSnapshot(
            pokemonCollection,
            (snapshot) => subscriber.next(new Set(snapshot.docs.map((document) => Number(document.id)))),
            (error) => subscriber.error(error),
          );
        })
        .catch((error) => subscriber.error(error));

      return () => {
        active = false;
        stopListening?.();
      };
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    this.streams.set(owner, stream);
    return stream;
  }

  async setOwned(owner: CollectionOwner, pokemon: PokemonListItem, owned: boolean): Promise<void> {
    const [firestore, { doc, serverTimestamp, writeBatch }] = await Promise.all([
      this.firebase.firestore,
      import('firebase/firestore'),
    ]);
    const ownerDocument = doc(firestore, 'collections', owner);
    const pokemonDocument = doc(ownerDocument, 'pokemon', pokemon.id.toString());
    const batch = writeBatch(firestore);

    batch.set(
      ownerDocument,
      {
        name: owner === 'martin' ? 'Martín' : 'Luis',
        collection: owner === 'luis-ash' ? 'Pokémon de Ash' : 'Pokédex',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    if (owned) {
      batch.set(pokemonDocument, {
        pokemonId: pokemon.id,
        name: pokemon.name,
        imageUrl: pokemon.imageUrl,
        obtainedAt: serverTimestamp(),
      });
    } else {
      batch.delete(pokemonDocument);
    }

    await batch.commit();
  }
}
