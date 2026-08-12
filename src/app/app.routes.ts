import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'luis', loadComponent: () => import('./luis/luis').then((module) => module.Luis), title: 'Colección de Luis' },
  { path: 'martin', loadComponent: () => import('./martin/martin').then((module) => module.Martin), title: 'Legendarios y míticos de Martín' },
  { path: '', pathMatch: 'full', redirectTo: 'luis' },
  { path: '**', redirectTo: 'luis' },
];
