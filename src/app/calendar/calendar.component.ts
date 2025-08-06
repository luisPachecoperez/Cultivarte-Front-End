import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { EventComponent } from "../eventos/components/event-form.component/event.component";
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CommonModule } from '@angular/common';
import { EventModalComponent } from '../eventos/components/event-modal.component/event-modal.component';
import { AsistenciaComponent } from "../asistencia/asistencia.component";

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [EventComponent, FullCalendarModule, CommonModule, EventModalComponent, AsistenciaComponent],
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  eventosCalendario: any[] = [];
  fechaSeleccionada: string | null = null;
  eventoEditando: any = null;

  eventoSeleccionado: any = null;
  mostrarModalAcciones: boolean = false;
  mostrarFormulario: boolean = false;
  mostrarAsistencia: boolean = false;


  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    events: [],
    locale: esLocale,
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      meridiem: 'short'
    },
    datesSet: this.onDatesSet.bind(this)
  };

  onDatesSet(dateInfo: any) {
    const fechaInicio = dateInfo.start.toISOString().split('T')[0];
    const fechaFin = dateInfo.end.toISOString().split('T')[0];
    console.log('📅 Vista del calendario:', { fechaInicio, fechaFin });
  }

  handleDateClick(arg: any) {
    console.log('📌 Click en fecha:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
    this.eventoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  handleEventClick(arg: any): void {
    console.log('🟢 Click en evento del calendario');

    const nombreSesion = arg.event.title;

    const eventosRelacionados = (this.calendarOptions.events as any[]).filter(
      e => e.title === nombreSesion
    );

    console.log(`🔍 ${eventosRelacionados.length} sesiones encontradas con nombre: ${nombreSesion}`);
    eventosRelacionados.forEach((e, i) => {
      console.log(`   [${i + 1}] ID: ${e.id} | Fecha: ${e.start.split('T')[0]} | Hora: ${e.start.split('T')[1].substring(0, 5)} - ${e.end.split('T')[1].substring(0, 5)}`);
    });

    const sesiones = eventosRelacionados.map(e => ({
      fecha: e.start.split('T')[0],
      horaInicio: e.start.split('T')[1].substring(0, 5),
      horaFin: e.end.split('T')[1].substring(0, 5)
    }));

    this.eventoSeleccionado = {
      ...arg.event.extendedProps,
      id: arg.event.id,
      nombreSesion,
      sesiones
    };

    console.log('🎯 Evento seleccionado para acciones:', this.eventoSeleccionado);
    this.mostrarModalAcciones = true;
  }


  abrirEdicion(eventoCalendario: any) {
    const nombreSesion = eventoCalendario.event.title;
    const eventosRelacionados = (this.calendarOptions.events as any[]).filter(
      e => e.title === nombreSesion
    );

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

    console.log('✏️ Abrir edición para:', this.eventoSeleccionado);
    this.mostrarFormulario = true;
  }

  agregarOActualizarEvento(evento: any): void {
    const { sesiones, editarUna, idSesionOriginal } = evento;

    if (!Array.isArray(sesiones) || sesiones.length === 0) {
      console.warn('⚠️ No hay sesiones para agregar o actualizar.');
      return;
    }

    const nombreSesion = sesiones[0].nombreSesion;
    console.log('🔁 Procesando sesiones para:', nombreSesion);

    if (editarUna && idSesionOriginal) {
      console.log('🛠 Editando solo una sesión:', idSesionOriginal);

      this.eventosCalendario = this.eventosCalendario.filter(ev => ev.id !== idSesionOriginal);
      this.calendarOptions.events = (this.calendarOptions.events as any[]).filter(ev => ev.id !== idSesionOriginal);

      console.log('🗑️ Eliminada sesión con ID:', idSesionOriginal);
    } else if (!editarUna) {
      console.log('🧹 Reemplazando todas las sesiones de:', nombreSesion);

      const eliminadas = this.eventosCalendario.filter(ev => ev.title === nombreSesion);
      eliminadas.forEach(ev => console.log('🗑️ Eliminada:', ev.id));

      this.eventosCalendario = this.eventosCalendario.filter(ev => ev.title !== nombreSesion);
      this.calendarOptions.events = (this.calendarOptions.events as any[]).filter(ev => ev.title !== nombreSesion);
    }


    // Agregar las nuevas sesiones
    sesiones.forEach((e, i) => {
      const eventoFormateado = {
        id: e.id, // ✅ Usamos el id único recibido
        title: e.nombreSesion,
        start: `${e.fecha}T${e.horaInicio}`,
        end: `${e.fecha}T${e.horaFin}`,
        extendedProps: { ...e }
      };

      console.log(`➕ Agregando sesión #${i + 1}:`, eventoFormateado);

      this.eventosCalendario.push(eventoFormateado);
    });

    // Refrescar el calendario
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...this.eventosCalendario]
    };

    this.eventoEditando = null;
    this.fechaSeleccionada = null;
    this.mostrarFormulario = false;

    console.log('✅ Sesiones actualizadas. Total en calendario:', this.eventosCalendario.length);
    console.table(this.eventosCalendario.map(ev => ({
      ID: ev.id,
      Fecha: ev.start.split('T')[0],
      HoraInicio: ev.start.split('T')[1].substring(0, 5),
      HoraFin: ev.end.split('T')[1].substring(0, 5),
      Nombre: ev.title
    })));
  }
  eliminarSesionDelCalendario(idSesion: string) {
    console.log('🗑️ Eliminando sesión desde evento:', idSesion);

    this.eventosCalendario = this.eventosCalendario.filter(ev => ev.id !== idSesion);
    this.calendarOptions.events = this.eventosCalendario;

    console.log('📆 Sesión eliminada del calendario:', idSesion);
  }


  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    if (accion === 'editar') {
      this.abrirEdicion({
        event: {
          extendedProps: this.eventoSeleccionado,
          title: this.eventoSeleccionado?.nombreSesion
        }
      });
      this.mostrarModalAcciones = false;
      return;
    }

    if (accion === 'asistencia') {
      this.mostrarFormulario = false;
      this.mostrarModalAcciones = false;
      this.mostrarAsistencia = true;
    }
  }
}
