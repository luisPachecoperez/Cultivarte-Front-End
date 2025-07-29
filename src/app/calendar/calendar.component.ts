import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { EventComponent } from "../eventos/components/event.component";
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [EventComponent, FullCalendarModule],
})
export class CalendarComponent {
  eventosCalendario: any[] = [];

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    dateClick: this.handleDateClick.bind(this) // 👈 manejar clics
  };

  handleDateClick(arg: any) {
    console.log('Fecha seleccionada:', arg.dateStr);
    // Abrir el modal directamente usando su ID
    const modalElement = document.getElementById('eventoModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  agregarEvento(nuevoEvento: any): void {
    console.log('📌 Evento recibido del hijo:', nuevoEvento);

    const eventoFormateado = {
      title: nuevoEvento.nombreSesion,
      start: `${nuevoEvento.fecha}T${nuevoEvento.horaInicio}`,
      end: `${nuevoEvento.fecha}T${nuevoEvento.horaFin}`,
      extendedProps: { ...nuevoEvento }
    };

    // Actualizar array de eventos
    this.eventosCalendario.push(eventoFormateado);

    // Reemplazar events para que Angular lo detecte
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...this.eventosCalendario]
    };
  }
}
