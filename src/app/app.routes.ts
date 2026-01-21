import { Routes } from '@angular/router';
import { CalendarComponent } from './calendar/pages/calendar.component';
import { RegisBeneficiarioComponent } from './beneficiarios/registro/page/regis_beneficiario.component';
import { ExcepcionesComponent } from './excepciones/pages/excepciones.component';
export const routes: Routes = [
  {
    path: 'v1/culti/calendar',
    component: CalendarComponent,
  },
  {
    path: 'v1/culti/beneficiarios',
    component: RegisBeneficiarioComponent,
  },
  {
    path: 'v1/culti/excepciones',
    component: ExcepcionesComponent,
  },
  {
    path: '**',
    redirectTo: 'v1/culti/calendar',
  },
];
