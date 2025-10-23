import { Component, signal } from '@angular/core';
import {RouterOutlet, RouterLink} from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  anoAtual: number = new Date().getFullYear();
}
