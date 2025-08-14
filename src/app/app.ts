import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponent} from './shared/components/header/header';
import {MainLayout} from './shared/layouts/main-layout/main-layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainLayout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  protected readonly title = signal('SmartFleet');
}
