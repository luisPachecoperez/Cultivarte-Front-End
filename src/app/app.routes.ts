import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/pages/calendar.component';
export const routes: Routes = [
  {
  path: 'calendar',
  component: CalendarComponent,
  },
  {
    path:'**',
    redirectTo: 'calendar',
  },
];
