import { Component, signal } from '@angular/core';
import { PhoneLoginComponent } from '../components/auth/login';

@Component({
  imports: [PhoneLoginComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('message-frontend');
}
