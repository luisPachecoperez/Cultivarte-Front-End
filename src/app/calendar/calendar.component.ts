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
  imports: [EventComponent, FullCalendarModule,CommonModule,EventModalComponent],
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

  onDatesSet (dateInfo: any) {

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
    this.eventoSeleccionado = {
      ...arg.event.extendedProps,
      id: arg.event.id
    };

    // Guardar el ID del modal seleccionado para futura acción
    // const modalAcciones = document.getElementById('modalAcciones');
    // if (modalAcciones) {
    //   const modal = new bootstrap.Modal(modalAcciones);
    //   modal.show();
    // }
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

  //trasladar
  // abrirEdicion(): void {
  //   // Cerrar modal de acciones
  //   const modalAcciones = bootstrap.Modal.getInstance(document.getElementById('modalAcciones')!)!;
  //   modalAcciones.hide();

  //   // Abrir modal de edición
  //   const modalFormulario = document.getElementById('eventoModal');
  //   if (modalFormulario) {
  //     const modal = new bootstrap.Modal(modalFormulario);
  //     modal.show();
  //   }
  // }

  agregarOActualizarEvento(evento: any): void {
    const eventoExistente = this.eventosCalendario.find(e => e.id === evento.id);

    const eventoFormateado = {
      id: evento.id ?? new Date().getTime().toString(), // nuevo ID si no existe
      title: evento.nombreSesion,
      start: `${evento.fecha}T${evento.horaInicio}`,
      end: `${evento.fecha}T${evento.horaFin}`,
      extendedProps: { ...evento }
    };

    if (eventoExistente) {
      // actualizar
      const index = this.eventosCalendario.findIndex(e => e.id === evento.id);
      this.eventosCalendario[index] = eventoFormateado;
    } else {
      // nuevo
      this.eventosCalendario.push(eventoFormateado);
    }

    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...this.eventosCalendario]
    };

    const nuevosEventos = Array.isArray(evento) ? evento : [evento];

  nuevosEventos.forEach(e => {
    const eventoConId = {
      id: crypto.randomUUID(),
      title: e.nombreSesion,
      start: `${e.fecha}T${e.horaInicio}`,
      end: `${e.fecha}T${e.horaFin}`,
      extendedProps: {
        ...e
      }
    };

    this.calendarOptions.events = [
      ...(this.calendarOptions.events as any[]),
      eventoConId
    ];
  });

    // reset
    this.eventoEditando = null;
    this.fechaSeleccionada = null;
  }

}
