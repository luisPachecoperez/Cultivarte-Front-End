import { Component, inject, viewChild } from '@angular/core';
import { CalendarOptions, EventInput, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { EventComponent } from "../../eventos/components/event.component/pages/event.component";
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CommonModule } from '@angular/common';
import { EventModalComponent } from "../../eventos/components/event-modal.component/pages/event-modal.component";
import { AsistenciaComponent } from "../../asistencia/asistencia-lista/pages/asistencia.component";
import timeGridPlugin from '@fullcalendar/timegrid';
import { CalendarService } from '../../calendar/services/calendar.services';
import { AsistenciaFotograficaComponent } from "../../asistencia/asistencia-fotografica/pages/asistencia-fotografica.component";
import { AsistenciaService } from '../../asistencia/asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  SesionCalendario,
  EventoFormPayload,
  EventoCalendarioWrapper,
  EventoCalendario,
  EventoSeleccionado,
} from '../interfaces/calendar.interface';

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [EventComponent, FullCalendarModule, CommonModule, EventModalComponent, AsistenciaComponent, AsistenciaFotograficaComponent, MatSnackBarModule],
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {

  private calendarService = inject(CalendarService);
  private asistenciaService = inject(AsistenciaService);
  // private eventoComponent = inject(EventComponent);
  private snack = inject(SnackbarService);

  // ✅ Nuevo API Angular 17+
  eventoComponent = viewChild(EventComponent);

  eventosCalendario: EventoCalendario[] = [];
  fechaSeleccionada: string | null = null;
  eventoEditando: EventoCalendario | null = null;

  eventoSeleccionado: EventoSeleccionado | null = null;
  mostrarModalAcciones: boolean = false;
  mostrarFormulario: boolean = false;
  mostrarAsistencia: boolean = false;
  mostrarAsistenciaFotografica: boolean = false;

  // 👇 ahora usamos un tipo en vez de dos flags
  tipoAsistencia: 'normal' | 'fotografica' | null = null;

  // Guardar última vista visible
  ultimaFechaInicio: string | null = null;
  ultimaFechaFin: string | null = null;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay' // 👈 Botones para cambiar vistas
    },
    views: {
      dayGridMonth: { buttonText: 'Mes' },
      timeGridWeek: { buttonText: 'Semana' },
      timeGridDay: { buttonText: 'Día' }
    },
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

  onDatesSet(dateInfo: DatesSetArg) {
    this.ultimaFechaInicio = dateInfo.start.toISOString().split('T')[0];
    this.ultimaFechaFin = dateInfo.end.toISOString().split('T')[0];

    console.log('📅 Vista del calendario:', {
      fechaInicio: this.ultimaFechaInicio,
      fechaFin: this.ultimaFechaFin
    });

    this.cargarSesiones();
  }

  cargarSesiones() {
    if (!this.ultimaFechaInicio || !this.ultimaFechaFin) return;

    const idUsuario = '1b1a3c6e-1d54-4eae-bbbf-277d74a6493a'; // 🔹 Temporal

    this.calendarService.obtenerSesiones(this.ultimaFechaInicio, this.ultimaFechaFin, idUsuario)
      .subscribe({
        next: (sesionesFormateadas: EventoCalendario[]) => {
          this.eventosCalendario = sesionesFormateadas;

          // 👇 transformamos a EventInput[]
          const eventosCalendar: EventInput[] = this.eventosCalendario.map(ev => ({
            id: ev.id,
            title: ev.title ?? '',
            start: ev.start ?? undefined,
            end: ev.end ?? undefined,
            extendedProps: ev.extendedProps
          }));

          this.calendarOptions = {
            ...this.calendarOptions,
            events: eventosCalendar
          };
        },
        error: err => {
          console.error('❌ Error al cargar sesiones:', err);
          this.snack.error('No fue posible cargar las sesiones');
        }
      });
  }


  handleDateClick(arg: DateClickArg) {
    console.log('📌 Click en fecha:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
    this.eventoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  private normalizarFechaHora(
    input: string | Date | number | number[] | null | undefined
  ): { fecha: string; hora: string } {
    if (!input) {
      return { fecha: '', hora: '' };
    }

    let date: Date;

    if (input instanceof Date) {
      date = input;
    } else if (typeof input === 'number') {
      date = new Date(input); // timestamp
    } else if (Array.isArray(input)) {
      // [YYYY, M, D] → OJO: meses en JS empiezan en 0
      const [year, month, day] = input;
      date = new Date(year, month - 1, day);
    } else {
      // asumimos string
      date = new Date(input);
    }

    const iso = date.toISOString();
    const [fecha, horaCompleta] = iso.split('T');
    return {
      fecha,
      hora: horaCompleta?.substring(0, 5) ?? ''
    };
  }




  handleEventClick(arg: EventClickArg): void {
    console.log('🟢 Click en evento del calendario');
    console.log('arg.event html', arg.event);

    const nombreSesion = arg.event.title;
    const eventosRelacionados = (this.calendarOptions.events as EventInput[])
      .filter(e => e.title === nombreSesion);

    // 👇 añadimos id y nombreSesion para que cumpla con `SesionCalendario`
    const sesiones = eventosRelacionados.map((e, idx) => {
      const inicio = this.normalizarFechaHora(e.start);
      const fin = this.normalizarFechaHora(e.end);

      return {
        id: e.id ?? `tmp-${idx}`,
        nombreSesion: e.title ?? '',
        fecha: inicio.fecha,
        horaInicio: inicio.hora,
        horaFin: fin.hora,
      };
    });

    // 👇 preferimos start/end, pero si no están usamos extendedProps
    const inicioEvento = this.normalizarFechaHora(arg.event.start);
    const finEvento = this.normalizarFechaHora(arg.event.end);

    this.eventoSeleccionado = {
      id_actividad: arg.event.extendedProps['id_actividad'],
      id_sesion: arg.event.id,
      asistentes_evento: arg.event.extendedProps['asistentes_evento'],
      nombreSesion,
      sesiones,
      fecha: inicioEvento.fecha,
      horaInicio: inicioEvento.hora,
      horaFin: finEvento.hora
    };

    console.log('🎯 Evento seleccionado para acciones:', this.eventoSeleccionado);
    this.mostrarModalAcciones = true;
  }


  abrirEdicion(eventoCalendario: EventoCalendarioWrapper) {
    const nombreSesion = eventoCalendario.event.title ?? '';

    const eventosRelacionados = (this.calendarOptions.events as EventInput[]).filter(
      e => e.title === nombreSesion
    );

    const sesiones: SesionCalendario[] = eventosRelacionados.map((e, idx) => ({
      id: e.id ?? `tmp-${idx}`,
      nombreSesion: e.title ?? '',
      fecha: (e.start as string).split('T')[0],
      horaInicio: (e.start as string).split('T')[1].substring(0, 5),
      horaFin: (e.end as string).split('T')[1].substring(0, 5),
    }));

    console.log('🎯 Evento seleccionado para edición:', eventoCalendario.event);

    this.eventoSeleccionado = {
      id_actividad: eventoCalendario.event.extendedProps?.['id_actividad'],
      id_sesion: eventoCalendario.event.extendedProps?.['id_sesion'],
      asistentes_evento: eventoCalendario.event.extendedProps?.['asistentes_evento'],
      tipo_evento: eventoCalendario.event.extendedProps?.['tipo_evento'],
      nombreSesion,
      sesiones,
      fecha: sesiones[0]?.fecha || '',
      horaInicio: sesiones[0]?.horaInicio || '',
      horaFin: sesiones[0]?.horaFin || '',
    };

    this.mostrarFormulario = true;
  }


  agregarOActualizarEvento(evento: EventoFormPayload): void {
    console.log('agregar o actualizar:', evento);
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
      this.calendarOptions.events = (this.calendarOptions.events as EventInput[])
        .filter(ev => ev.id !== idSesionOriginal);

      console.log('🗑️ Eliminada sesión con ID:', idSesionOriginal);
    } else if (!editarUna) {
      console.log('🧹 Reemplazando todas las sesiones de:', nombreSesion);

      const eliminadas = this.eventosCalendario.filter(ev => ev.title === nombreSesion);
      eliminadas.forEach(ev => console.log('🗑️ Eliminada:', ev.id));

      this.eventosCalendario = this.eventosCalendario.filter(ev => ev.title !== nombreSesion);
      this.calendarOptions.events = (this.calendarOptions.events as EventInput[])
        .filter(ev => ev.title !== nombreSesion);
    }

    // Agregar las nuevas sesiones
    sesiones.forEach((e, i) => {
      console.log('Agregar sesion', e);
      const eventoFormateado: EventoCalendario = {
        id: e.id ?? `tmp-${i}`,
        title: e.nombreSesion ?? '',
        start: `${e.fecha}T${e.horaInicio}`,
        end: `${e.fecha}T${e.horaFin}`,
        extendedProps: {
          id: e.id ?? `tmp-${i}`,
          nombreSesion: e.nombreSesion ?? '',
          fecha: e.fecha,
          horaInicio: e.horaInicio,
          horaFin: e.horaFin,
          id_actividad: e.id_actividad,
          id_sesion: e.id_sesion,
          asistentes_evento: e.asistentes_evento,
          tipo_evento: e.tipo_evento
        }
      };

      this.calendarOptions.events = (this.calendarOptions.events as EventInput[])
        .filter(ev => ev.id !== idSesionOriginal);

      console.log(`➕ Agregando sesión #${i + 1}:`, eventoFormateado);

      this.eventosCalendario.push(eventoFormateado);
    });

    // ✅ Refrescar el calendario con EventInput[]
    const eventosCalendar: EventInput[] = this.eventosCalendario.map(ev => ({
      id: ev.id,
      title: ev.title ?? '',
      start: ev.start ?? undefined,
      end: ev.end ?? undefined,
      extendedProps: ev.extendedProps
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: eventosCalendar
    };

    this.eventoEditando = null;
    this.fechaSeleccionada = null;
    this.mostrarFormulario = false;

    console.log('✅ Sesiones actualizadas. Total en calendario:', this.eventosCalendario.length);
    console.log('✅ Sesiones actualizadas. Total en calendario:', this.eventosCalendario);
  }


  eliminarSesionDelCalendario(id: string) {
    // Si es UUID asumimos que es una sesión individual
    const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(id);

    if (esUUID) {
      console.log('🗑️ Eliminando sesión individual:', id);
      this.eventosCalendario = this.eventosCalendario.filter(ev => ev.id !== id);
    } else {
      console.log('🧹 Eliminando todas las sesiones con nombre:', id);
      this.eventosCalendario = this.eventosCalendario.filter(ev => ev.title !== id);
    }

    // ✅ Convertimos a EventInput[] antes de asignar a calendarOptions
    const eventosCalendar: EventInput[] = this.eventosCalendario.map(ev => ({
      id: ev.id,
      title: ev.title ?? '',
      start: ev.start ?? undefined, // 👈 null → undefined
      end: ev.end ?? undefined,
      extendedProps: ev.extendedProps
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: eventosCalendar
    };

    console.log('📆 Sesión(es) eliminada(s). Calendario actualizado.');
  }

  // ✅ Recargar sesiones al cerrar formularios o modales
  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.eventoSeleccionado = null;
    this.cargarSesiones();
  }

  cerrarModalAcciones() {
    this.mostrarModalAcciones = false;
    this.cargarSesiones();
  }

  cerrarAsistencia() {
    this.mostrarAsistencia = false;
    this.cargarSesiones();
  }

  cerrarAsistenciaFotografica() { // 👈 nuevo
    this.mostrarAsistenciaFotografica = false;
    this.cargarSesiones();
  }

  // 🔹 Aquí es donde decidimos si abrir normal o fotográfica
  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    if (!this.eventoSeleccionado) {
      console.warn('⚠️ No hay evento seleccionado');
      return;
    }

    console.log('🎯 evento seleccionado 1:', this.eventoSeleccionado);
    console.log('🎯 Accion seleccionadaaaaaaa:', accion);

    if (accion === 'editar') {
      if (this.eventoSeleccionado.id_actividad) {
        this.eventoComponent()?.cargarEdicionDesdeBackend(this.eventoSeleccionado.id_actividad);
      } else {
        this.eventoComponent()?.precargarFormulario(this.eventoSeleccionado);
      }
      this.mostrarFormulario = true;
      this.mostrarModalAcciones = false;
      return;
    }

    if (accion === 'asistencia') {
      this.mostrarFormulario = false;
      this.mostrarModalAcciones = false;

      this.asistenciaService.obtenerDetalleAsistencia(this.eventoSeleccionado.id_sesion!)
        .subscribe((respuesta) => {
          console.log('📥 Respuesta detalle asistencia:', respuesta);

          this.eventoSeleccionado = { ...this.eventoSeleccionado!, ...respuesta };
          this.tipoAsistencia = respuesta.foto === 'S' ? 'fotografica' : 'normal';
          this.mostrarAsistencia = true;
        });
    }
  }

}

