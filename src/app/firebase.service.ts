import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import type { Analytics } from 'firebase/analytics';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  readonly app: FirebaseApp = initializeApp(firebaseConfig);

  private analytics?: Analytics;
  private firestorePromise?: Promise<Firestore>;

  get firestore(): Promise<Firestore> {
    this.firestorePromise ??= import('firebase/firestore').then(({ getFirestore }) =>
      getFirestore(this.app),
    );
    return this.firestorePromise;
  }

  async initialize(): Promise<void> {
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    if (await isSupported()) {
      this.analytics = getAnalytics(this.app);
    }
  }
}
