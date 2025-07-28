import { Component, ViewChild } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventComponent } from '../eventos/components/event.component';
import { FullCalendarModule } from '@fullcalendar/angular';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  imports: [EventComponent, FullCalendarModule],
})
export class CalendarComponent {
  // @ViewChild('eventoModal') eventoModal!: EventComponent;
  @ViewChild('eventoForm', { static: true }) eventComponent!: EventComponent;

  eventosCalendario: any[] = [];

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    dateClick: this.onDateClick.bind(this),
    events: this.eventosCalendario
  };

  onDateClick(arg: any) {
    this.eventComponent.abrirModal(arg.dateStr);
  }

  agregarEvento(evento: any) {
    this.eventosCalendario.push(evento);
    // Reasigna events para que FullCalendar detecte el cambio
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...this.eventosCalendario]
    };
  }
}
