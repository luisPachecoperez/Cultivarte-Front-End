import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { EventComponent } from "../../eventos/components/event.component/pages/event.component";
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
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
import { inject } from '@angular/core';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';

interface SesionPayload {
  id: string;
  nombreSesion: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  [key: string]: unknown; // por si vienen más propiedades
}

interface EventoActualizarPayload {
  sesiones: SesionPayload[];
  editarUna?: boolean;
  idSesionOriginal?: string;
}

type EventClickMinimal = {
  event: {
    id: string;
    title: string | null;
    start: string;  // ya lo formateamos como string ISO en el service
    end: string;
    extendedProps: {
      id_actividad?: string;
      id_sesion?: string;
      asistentes_evento?: number;
      tipo_evento?: string;
      [key: string]: unknown;
    };
  };
};
// arriba del componente, junto con tus other imports
type DateClickMinimal = {
  date: Date;
  dateStr: string;
  allDay?: boolean;
  dayEl?: HTMLElement;
  jsEvent?: MouseEvent;
  view?: unknown;
};
export interface EventoCalendario {
  id: string;
  title: string;            // siempre string (mapear con fallback '')
  start: string;            // ISO string 'YYYY-MM-DDTHH:mm' (siempre string)
  end: string;              // ISO string
  extendedProps: {
    id_actividad?: string;
    id_sesion?: string;
    asistentes_evento?: number;
    tipo_evento?: string;
    desde?: string;
    hasta?: string;
    // otros campos que el backend devuelva...
    [key: string]: unknown;
  };
}

export interface SesionCorta {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface EventoSeleccionado {
  id_actividad: string;               // forzamos string (no opcional)
  id_sesion: string;
  asistentes_evento: number;
  tipo_evento: string;
  nombreSesion: string;
  sesiones: SesionCorta[];           // siempre array
  fecha: string;
  horaInicio: string;
  horaFin: string;
  // opcional: otros campos precargados del servicio de asistencia
  // si no los necesitas estrictamente, puedes agregarlos como opcionales
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [EventComponent, FullCalendarModule, CommonModule, EventModalComponent, AsistenciaComponent, AsistenciaFotograficaComponent, MatSnackBarModule],
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  // inyecciones usando `inject()`
  private calendarService = inject(CalendarService);
  private asistenciaService = inject(AsistenciaService);
  private eventoComponent = inject(EventComponent); // <- atención (ver nota abajo)
  private snack = inject(SnackbarService);

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
    events: this.eventosCalendario,
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

    this.calendarService
      .obtenerSesiones(this.ultimaFechaInicio, this.ultimaFechaFin, idUsuario)
      .subscribe({
        next: (sesionesFormateadas: EventoCalendario[]) => {
          this.eventosCalendario = sesionesFormateadas;
          this.calendarOptions = {
            ...this.calendarOptions,
            events: [...this.eventosCalendario]
          };
        },
        error: () => {
          this.snack.error('No fue posible cargar las sesiones');
        }
      });
  }

  handleDateClick(arg: DateClickMinimal) {
    console.log('📌 Click en fecha:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
    this.eventoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  handleEventClick(arg: EventClickArg): void {
    console.log('🟢 Click en evento del calendario');
    console.log('arg.event html', arg.event);

    const event = arg.event;
    // startStr y endStr son strings; preferibles a event.start (Date | null)
    const startStr = event.startStr ?? '';
    const endStr = event.endStr ?? '';
    const nombreSesion = event.title ?? '';
    console.log('nombreSesion', nombreSesion);
    console.log('calendar options', this.calendarOptions.events);

    const eventosRelacionados = (this.calendarOptions.events as EventoCalendario[]).filter(
      e => e.title === nombreSesion
    );

    console.log('eventosRelacionados', eventosRelacionados);

    const sesiones: SesionCorta[] = eventosRelacionados.map(e => {
      // e.start tiene formato ISO 'YYYY-MM-DDTHH:mm' (tal como lo mapeamos en el service)
      const [fecha, horaInicio] = (e.start ?? '').split('T');
      const [, horaFin] = (e.end ?? '').split('T');
      return {
        fecha: fecha ?? '',
        horaInicio: (horaInicio ?? '').substring(0, 5),
        horaFin: (horaFin ?? '').substring(0, 5)
      };
    });;

    console.log('arg.event', arg.event);
    // si el evento puntual tiene extendedProps.desde/hasta (strings 'YYYY-MM-DD HH:mm:ss'):
    const ext = event.extendedProps as Partial<EventoCalendario['extendedProps']>;
    const desde = ext?.desde ?? '';
    const hasta = ext?.hasta ?? '';

    // separar fecha/hora si vienen con espacio
    const [fechaDesde, horaInicio] = (desde || startStr || '').split(' ');
    const [, horaFin] = (hasta || endStr || '').split(' ');
    this.eventoSeleccionado = {
      id_actividad: (ext?.id_actividad ?? '') as string,
      id_sesion: (ext?.id_sesion ?? event.id ?? '') as string,
      asistentes_evento: Number(ext?.asistentes_evento ?? 0),
      tipo_evento: ext?.tipo_evento ?? '',
      nombreSesion: nombreSesion ?? '',
      sesiones,
      fecha: fechaDesde ?? (sesiones[0]?.fecha ?? ''),
      horaInicio: (horaInicio ?? (sesiones[0]?.horaInicio ?? '')) as string,
      horaFin: (horaFin ?? (sesiones[0]?.horaFin ?? '')) as string
    };

    console.log('🎯 Evento seleccionado para acciones:', this.eventoSeleccionado);
    this.mostrarModalAcciones = true;
  }

  abrirEdicion(eventoCalendario: EventClickMinimal) {
    const nombreSesion = eventoCalendario.event.title ?? '';

    // Filtrar los eventos relacionados por nombre
    const eventosRelacionados = (this.calendarOptions.events as EventoCalendario[])
      .filter(e => e.title === nombreSesion);

    // Construir sesiones (fecha/hora separadas)
    const sesiones = eventosRelacionados.map(e => {
      const [fecha, horaInicio] = (e.start ?? '').split('T');
      const [, horaFin] = (e.end ?? '').split('T');
      return {
        fecha: fecha ?? '',
        horaInicio: (horaInicio ?? '').substring(0, 5),
        horaFin: (horaFin ?? '').substring(0, 5)
      };
    });

    console.log('🎯 Evento seleccionado para edición:', eventoCalendario.event);

    this.eventoSeleccionado = {
      id_actividad: eventoCalendario.event.extendedProps.id_actividad ?? '',
      id_sesion: eventoCalendario.event.extendedProps.id_sesion ?? '',
      asistentes_evento: eventoCalendario.event.extendedProps.asistentes_evento ?? 0,
      tipo_evento: eventoCalendario.event.extendedProps.tipo_evento ?? '',
      nombreSesion,
      sesiones,
      fecha: sesiones[0]?.fecha || '',
      horaInicio: sesiones[0]?.horaInicio || '',
      horaFin: sesiones[0]?.horaFin || ''
    };

    this.mostrarFormulario = true;
  }



  agregarOActualizarEvento(evento: EventoActualizarPayload): void {
    console.log('agregar o actualizar:');
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
      this.calendarOptions.events = (this.calendarOptions.events as EventoCalendario[]).filter(ev => ev.id !== idSesionOriginal);

      console.log('🗑️ Eliminada sesión con ID:', idSesionOriginal);
    } else if (!editarUna) {
      console.log('🧹 Reemplazando todas las sesiones de:', nombreSesion);

      const eliminadas = this.eventosCalendario.filter(ev => ev.title === nombreSesion);
      eliminadas.forEach(ev => console.log('🗑️ Eliminada:', ev.id));

      this.eventosCalendario = this.eventosCalendario.filter(ev => ev.title !== nombreSesion);
      this.calendarOptions.events = (this.calendarOptions.events as EventoCalendario[]).filter(ev => ev.title !== nombreSesion);
    }

    // Agregar las nuevas sesiones
    sesiones.forEach((e, i) => {
      console.log('Agregar sesion', e);
      const eventoFormateado: EventoCalendario = {
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

    this.calendarOptions.events = [...this.eventosCalendario];
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
    console.log('🎯 evento seleccionado 1:', this.eventoSeleccionado);
    console.log('🎯 Accion seleccionadaaaaaaa:', accion);
    if (accion === 'editar') {
      if (this.eventoSeleccionado?.id_actividad) {
        this.eventoComponent.cargarEdicionDesdeBackend(this.eventoSeleccionado.id_actividad);
      } else {
        this.eventoComponent.precargarFormulario(this.eventoSeleccionado);
      }
      this.mostrarFormulario = true;
      // this.abrirEdicion({
      //   event: {
      //     extendedProps: this.eventoSeleccionado,
      //     title: this.eventoSeleccionado?.nombreSesion
      //   }
      // });
      this.mostrarModalAcciones = false;
      return;
    }

    if (accion === 'asistencia') {
      this.mostrarFormulario = false;
      this.mostrarModalAcciones = false;
      const idSesion = this.eventoSeleccionado?.id_sesion;
      if (!idSesion) {
        console.warn('No hay sesión seleccionada para tomar asistencia');
        this.snack.error('No hay sesión seleccionada');
        return;
      }

      this.asistenciaService.obtenerDetalleAsistencia(idSesion)
        .subscribe((respuesta) => {
          console.log('📥 Respuesta detalle asistencia:', respuesta);

          const resp = respuesta ?? {};

          // merge seguro: garantizamos strings y arrays
          const merged: EventoSeleccionado = {
            id_actividad: this.eventoSeleccionado?.id_actividad ?? '', // si tu backend no manda id_actividad, mantiene '' por seguridad
            id_sesion: this.eventoSeleccionado?.id_sesion ?? (resp.id_sesion ?? idSesion),
            asistentes_evento: this.eventoSeleccionado?.asistentes_evento ?? (resp.numero_asistentes ?? 0),
            tipo_evento: this.eventoSeleccionado?.tipo_evento ?? '',
            nombreSesion: this.eventoSeleccionado?.nombreSesion ?? '',
            sesiones: this.eventoSeleccionado?.sesiones ?? [], // mantenemos sesiones que ya estaban (si aplican)
            fecha: this.eventoSeleccionado?.fecha ?? (this.eventoSeleccionado?.sesiones?.[0]?.fecha ?? ''),
            horaInicio: this.eventoSeleccionado?.horaInicio ?? (this.eventoSeleccionado?.sesiones?.[0]?.horaInicio ?? ''),
            horaFin: this.eventoSeleccionado?.horaFin ?? (this.eventoSeleccionado?.sesiones?.[0]?.horaFin ?? '')
          };

          this.eventoSeleccionado = merged;


          // Definir el tipo de asistencia
          this.tipoAsistencia = respuesta.foto === 'S' ? 'fotografica' : 'normal';

          // Mostrar modal
          this.mostrarAsistencia = true;
        });
    }
  }
}

