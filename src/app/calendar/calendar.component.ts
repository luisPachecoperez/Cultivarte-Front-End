import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { EventComponent } from "../eventos/components/event.component";
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import * as bootstrap from 'bootstrap';
import esLocale from '@fullcalendar/core/locales/es';

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [EventComponent, FullCalendarModule],
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  eventosCalendario: any[] = [];
  fechaSeleccionada: string | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    locale: esLocale,
    dateClick: this.handleDateClick.bind(this), // 👈 manejar clics
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      meridiem: 'short' // 👈 Esto activa 'a' / 'p' en vez de 'AM'/'PM' en algunos entornos
    },
  };
  calendarComponent: any;

  handleDateClick(arg: any) {
    console.log('Fecha seleccionada:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
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
