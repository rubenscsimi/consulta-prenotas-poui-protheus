import { Routes } from '@angular/router';

import { Analitica } from './analitica/analitica';
import { Sintetica } from './sintetica/sintetica';

export const routes: Routes = [
  { path: 'analitica', component: Analitica },
  { path: '**', component: Sintetica }
];
