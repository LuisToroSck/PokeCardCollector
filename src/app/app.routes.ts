import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'luis', loadComponent: () => import('./luis/luis').then((module) => module.Luis), title: 'Colección de Luis' },
  { path: 'luis-ash', loadComponent: () => import('./ash/ash').then((module) => module.Ash), title: 'Pokémon de Ash · Luis' },
  { path: 'martin', loadComponent: () => import('./martin/martin').then((module) => module.Martin), title: 'Legendarios y míticos de Martín' },
  { path: 'tcgdex', loadComponent: () => import('./tcgdex/tcgdex').then((module) => module.Tcgdex), title: 'Conexión con TCGdex' },
  { path: '', pathMatch: 'full', redirectTo: 'luis' },
  { path: '**', redirectTo: 'luis' },
];
