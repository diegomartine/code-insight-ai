import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/analysis/analysis-page/analysis-page.component').then(
        (m) => m.AnalysisPageComponent,
      ),
    title: 'Code Insight AI — Automated Repository Reverse Engineering',
  },
  { path: '**', redirectTo: '' },
];
