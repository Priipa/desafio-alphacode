import { Routes } from '@angular/router';
import { CadastroComponent } from './pages/cadastro/cadastro.component';


export const routes: Routes = [
  { path: '', redirectTo: 'cadastro', pathMatch: 'full' },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'cadastro/:id', component: CadastroComponent },
  { path: '**', redirectTo: 'cadastro' },
];
