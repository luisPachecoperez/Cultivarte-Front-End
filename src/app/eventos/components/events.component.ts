import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-events',
  imports: [],
  template: `<p>events works!</p>`,
  styleUrl: './events.component.css',
})
export class EventsComponent {
  showForm = signal(false);
}
