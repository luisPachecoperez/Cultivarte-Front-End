import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { EventComponent } from "../eventos/components/event-form.component/event.component";
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import * as bootstrap from 'bootstrap';
import esLocale from '@fullcalendar/core/locales/es';
import { CommonModule } from '@angular/common';
import { EventModalComponent } from '../eventos/components/event-modal.component/event-modal.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [EventComponent, FullCalendarModule, CommonModule, EventModalComponent],
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  eventosCalendario: any[] = [];
  fechaSeleccionada: string | null = null;
  eventoEditando: any = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    locale: esLocale,
    dateClick: this.handleDateClick.bind(this), // 👈 manejar clics
    eventClick: this.handleEventClick.bind(this),
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      meridiem: 'short' // 👈 Esto activa 'a' / 'p' en vez de 'AM'/'PM' en algunos entornos
    },
    datesSet: this.onDatesSet.bind(this) // 👈 aquí va el método que manejará el cambio
  };
  calendarComponent: any;
  eventoSeleccionado: any;
  mostrarModalAcciones: boolean | undefined;

  onDatesSet(dateInfo: any) {

    var year = dateInfo.start.getFullYear()
    var month = (dateInfo.start.getMonth() + 1).toString().padStart(2, '0') // +1 porque los meses van de 0 a 11
    var day = dateInfo.start.getDate().toString().padStart(2, '0')
    const fechaInicio: string = `${year}-${month}-${day}`;

    year = dateInfo.end.getFullYear()
    month = (dateInfo.end.getMonth() + 1).toString().padStart(2, '0') // +1 porque los meses van de 0 a 11
    day = dateInfo.end.getDate().toString().padStart(2, '0')

    const fechaFin: string = `${year}-${month}-${day}`;
    console.log('Fecha inicio:', fechaInicio);
    console.log('Fecha fin:', fechaFin);
    //Aqui llamar al back pasandole como rango fechaInicio y fechaFin

  }

  // 👇 clic sobre evento existente
  handleEventClick(arg: any): void {
    console.log('✅ CLIC EN EVENTO:', arg);

    const nombreSesion = arg.event.title;

    const eventosRelacionados = (this.calendarOptions.events as any[])
      .filter(e => e.title === nombreSesion);

    const sesiones = eventosRelacionados.map(e => ({
      fecha: e.start.split('T')[0],
      horaInicio: e.start.split('T')[1].substring(0, 5),
      horaFin: e.end.split('T')[1].substring(0, 5)
    }));

    this.eventoSeleccionado = {
      ...arg.event.extendedProps,
      id: arg.event.id,
      nombreSesion: nombreSesion,
      sesiones: sesiones
    };

    const modal = new bootstrap.Modal(document.getElementById('modalAcciones')!);
    modal.show();
  }

  handleDateClick(arg: any) {
    console.log('Fecha seleccionada:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
    this.eventoEditando = null; //
    // Abrir el modal directamente usando su ID
    const modalElement = document.getElementById('eventoModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  abrirEdicion(eventoCalendario: any) {
    const nombreSesion = eventoCalendario.event.title;

    const eventosRelacionados = (this.calendarOptions.events as any[])
      .filter(e => e.title === nombreSesion);

    const sesiones = eventosRelacionados.map(e => ({
      fecha: e.start.split('T')[0],
      horaInicio: e.start.split('T')[1].substring(0, 5),
      horaFin: e.end.split('T')[1].substring(0, 5)
    }));

    this.eventoSeleccionado = {
      ...eventoCalendario.event.extendedProps,
      nombreSesion,
      sesiones
    };

    this.mostrarModalAcciones = true;
  }

  agregarOActualizarEvento(evento: any): void {
    const nuevosEventos = Array.isArray(evento) ? evento : [evento];

    if (!nuevosEventos.length) return;

    const nombreSesion = nuevosEventos[0].nombreSesion;

    nuevosEventos.forEach(e => {
      const id = e.id ?? crypto.randomUUID(); // ID nuevo si no tiene

      const eventoFormateado = {
        id,
        title: e.nombreSesion,
        start: `${e.fecha}T${e.horaInicio}`,
        end: `${e.fecha}T${e.horaFin}`,
        extendedProps: { ...e }
      };

      // 🔥 Eliminar solo si coincide nombre + fecha + hora exacta
      this.eventosCalendario = this.eventosCalendario.filter(ev =>
        !(
          ev.title === e.nombreSesion &&
          ev.start.startsWith(e.fecha) &&
          ev.start.includes(e.horaInicio)
        )
      );

      this.calendarOptions.events = (this.calendarOptions.events as any[]).filter(ev =>
        !(
          ev.title === e.nombreSesion &&
          ev.start?.startsWith(e.fecha) &&
          ev.start?.includes(e.horaInicio)
        )
      );

      // Agregar el evento nuevo
      this.eventosCalendario.push(eventoFormateado);
      (this.calendarOptions.events as any[]).push({ ...eventoFormateado });
    });

    // Reset
    this.eventoEditando = null;
    this.fechaSeleccionada = null;
    this.calendarOptions = { ...this.calendarOptions };
  }

}
