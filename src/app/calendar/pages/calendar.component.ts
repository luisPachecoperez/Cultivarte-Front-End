import { PreAsistencia } from '../../asistencia/interfaces/pre-asistencia.interface';
import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import { EventComponent } from '../../eventos/components/event.component/pages/event.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { CommonModule } from '@angular/common';
import { EventModalComponent } from '../../eventos/components/event-modal.component/pages/event-modal.component';
import { AsistenciaComponent } from '../../asistencia/asistencia-lista/pages/asistencia.component';
import timeGridPlugin from '@fullcalendar/timegrid';
import { CalendarService } from '../../calendar/services/calendar.services';
import { AsistenciaFotograficaComponent } from '../../asistencia/asistencia-fotografica/pages/asistencia-fotografica.component';
import { AsistenciaService } from '../../asistencia/asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { AuthService } from '../../shared/services/auth.service';
import { LoadingService } from '../../shared/services/loading.service';
import { EventoCalendario } from '../interfaces/evento-calendario.interface';
import { Sesiones } from '../../eventos/interfaces/sesiones.interface';

interface SesionPayload {
  id_actividad: string;
  id_sesion: string;
  nombre_actividad: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  [key: string]: unknown; // por si vienen más propiedades
}

interface EventoActualizarPayload {
  sesiones: SesionPayload[];
  editarUna?: boolean;
  id_sesionOriginal?: string;
}

type EventClickMinimal = {
  event: {
    id: string;
    title: string | null;
    start: string; // ya lo formateamos como string ISO en el service
    end: string;
    extendedProps: {
      id_actividad?: string;
      id_sesion?: string;
      nro_asistentes?: number;
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

@Component({
  selector: 'app-calendar',
  standalone: true,
  templateUrl: './calendar.component.html',
  imports: [
    EventComponent,
    FullCalendarModule,
    CommonModule,
    EventModalComponent,
    AsistenciaComponent,
    AsistenciaFotograficaComponent,
    MatSnackBarModule,
  ],
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  // inyecciones usando `inject()`
  private calendarService = inject(CalendarService);
  private asistenciaService = inject(AsistenciaService);
  private eventoComponent = inject(EventComponent); // <- atención (ver nota abajo)
  private snack = inject(SnackbarService);
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService); // 👈 usado en el template

  eventosCalendario: EventoCalendario[] = [];
  fechaSeleccionada: string | null = null;
  eventoEditando: EventoCalendario | null = null;

  eventoSeleccionado: Sesiones |undefined;
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
      right: 'dayGridMonth,timeGridWeek,timeGridDay', // 👈 Botones para cambiar vistas
    },
    views: {
      dayGridMonth: { buttonText: 'Mes' },
      timeGridWeek: { buttonText: 'Semana' },
      timeGridDay: { buttonText: 'Día' },
    },
    events: this.eventosCalendario,
    locale: esLocale,
    dateClick: this.handleDateClick.bind(this),
    eventClick: this.handleEventClick.bind(this),
    eventTimeFormat: {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      meridiem: 'short',
    },
    datesSet: this.onDatesSet.bind(this),
  };

  onDatesSet(dateInfo: DatesSetArg) {
    //console.log("ondataset");
    this.loadingService.show(); // 🔄 mostrar
    try {
      this.ultimaFechaInicio = dateInfo.start.toISOString().split('T')[0];
      this.ultimaFechaFin = dateInfo.end.toISOString().split('T')[0];

      //console.log('📅 Vista del calendario:', {fechaInicio: this.ultimaFechaInicio,fechaFin: this.ultimaFechaFin,});

      this.cargarSesiones();
    } finally {
      this.loadingService.hide(); // 🔄 mostrar
    }
  }

  cargarSesiones() {
    if (!this.ultimaFechaInicio || !this.ultimaFechaFin) return;

    const idUsuario = this.authService.getUserUuid();
    //console.log("cargando sesiones para el calendario");
    this.calendarService
      .obtenerSesiones(this.ultimaFechaInicio, this.ultimaFechaFin, idUsuario)
      .then((sesionesFormateadas) => {
        //console.log("sesiones formateadas:",sesionesFormateadas);
        this.eventosCalendario = sesionesFormateadas;
        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...this.eventosCalendario],
        };
      })
      .catch(() => {
        //console.log('No fue posible cargar las sesiones');
      });
  }

  handleDateClick(arg: DateClickMinimal) {
    //console.log('📌 Click en fecha:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
    this.eventoSeleccionado = undefined;
    this.mostrarFormulario = true;
  }

  handleEventClick(arg: EventClickArg): void {
    //console.log('🟢 Click en evento del calendario');
    //console.log('arg.event html', arg.event);

    const event = arg.event;
    // startStr y endStr son strings; preferibles a event.start (Date | null)
    const startStr = event.startStr ?? '';
    const endStr = event.endStr ?? '';
    const nombre_actividad = event.title ?? '';
    //console.log('nombre_actividad', nombre_actividad);
    //console.log('calendar options', this.calendarOptions.events);

    const eventosRelacionados = (
      this.calendarOptions.events as EventoCalendario[]
    ).filter((e) => e.title === nombre_actividad);

    //console.log('eventosRelacionados', eventosRelacionados);

    const sesiones: Sesiones[] = eventosRelacionados.map((e) => {
      // e.start tiene formato ISO 'YYYY-MM-DDTHH:mm' (tal como lo mapeamos en el service)
      const [fecha_actividad, hora_inicio] = (e.start ?? '').split('T');
      const [, hora_fin] = (e.end ?? '').split('T');
      return {
        id_actividad: e.id_actividad,
        id_sesion: e.id_sesion,
        fecha_actividad: fecha_actividad ?? '',
        hora_inicio: (hora_inicio ?? '').substring(0, 5),
        hora_fin: (hora_fin ?? '').substring(0, 5),
      };
    });

    //console.log('arg.event', arg.event);
    // si el evento puntual tiene extendedProps.desde/hasta (strings 'YYYY-MM-DD HH:mm:ss'):
    const ext = event.extendedProps as Partial<
      EventoCalendario['extendedProps']
    >;
    const desde = ext?.desde ?? '';
    const hasta = ext?.hasta ?? '';

    // separar fecha/hora si vienen con espacio
    const [fechaDesde, hora_inicio] = (desde || startStr || '').split(' ');
    const [, hora_fin] = (hasta || endStr || '').split(' ');
    this.eventoSeleccionado = {
      id_actividad: ext?.id_actividad ?? '',
      id_sesion: ext?.id_sesion ?? event.id ?? '',
      asistentes_evento: Number(ext?.asistentes_evento ?? 0),
      nombre_actividad: nombre_actividad ?? '',
      sesiones: sesiones,
      fecha_actividad: fechaDesde ?? sesiones[0]?.fecha_actividad ?? '',
      hora_inicio: hora_inicio ?? sesiones[0]?.hora_inicio ?? '',
      hora_fin: hora_fin ?? sesiones[0]?.hora_fin ?? '',
    };

    //console.log('🎯 Evento seleccionado para acciones:',this.eventoSeleccionado);
    this.mostrarModalAcciones = true;
  }

  abrirEdicion(sesionCalendario: EventClickMinimal) {
    const nombre_actividad = sesionCalendario.event.title ?? '';

    // Filtrar los eventos relacionados por nombre
    const eventosRelacionados = (
      this.calendarOptions.events as EventoCalendario[]
    ).filter((e) => e.title === nombre_actividad);

    // Construir sesiones (fecha/hora separadas)
    const sesiones: Sesiones[] = eventosRelacionados.map((e) => {
      const [fecha_actividad, hora_inicio] = (e.start ?? '').split('T');
      const [, hora_fin] = (e.end ?? '').split('T');
      return {
        id_actividad: e.id_actividad,
        id_sesion: e.id_sesion,
        fecha_actividad: fecha_actividad ?? '',
        hora_inicio: (hora_inicio ?? '').substring(0, 5),
        hora_fin: (hora_fin ?? '').substring(0, 5),
      };
    });

    //console.log('🎯 Evento seleccionado para edición:', sesionCalendario.event);

    this.eventoSeleccionado = {
      id_actividad: sesionCalendario.event.extendedProps.id_actividad ?? '',
      id_sesion: sesionCalendario.event.extendedProps.id_sesion ?? '',
      nro_asistentes: sesionCalendario.event.extendedProps.nro_asistentes ?? 0,
      nombre_actividad,
      sesiones,
      fecha_actividad: sesiones[0]?.fecha_actividad || '',
      hora_inicio: sesiones[0]?.hora_inicio || '',
      hora_fin: sesiones[0]?.hora_fin || '',
    };

    this.mostrarFormulario = true;
  }

  agregarOActualizarEvento(evento: EventoActualizarPayload): void {
    //console.log('agregar o actualizar:');
    const { sesiones, editarUna, id_sesionOriginal } = evento;

    if (!Array.isArray(sesiones) || sesiones.length === 0) {
      console.warn('⚠️ No hay sesiones para agregar o actualizar.');
      return;
    }

    const nombre_actividad = sesiones[0].nombre_actividad;
    //console.log('🔁 Procesando sesiones para:', nombre_actividad);

    if (editarUna && id_sesionOriginal) {
      //console.log('🛠 Editando solo una sesión:', id_sesionOriginal);

      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.id_sesion !== id_sesionOriginal,
      );
      this.calendarOptions.events = (
        this.calendarOptions.events as EventoCalendario[]
      ).filter((ev) => ev.id_sesion !== id_sesionOriginal);

      //console.log('🗑️ Eliminada sesión con ID:', id_sesionOriginal);
    } else if (!editarUna) {
      //console.log('🧹 Reemplazando todas las sesiones de:', nombre_actividad);

      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.title !== nombre_actividad,
      );
      this.calendarOptions.events = (
        this.calendarOptions.events as EventoCalendario[]
      ).filter((ev) => ev.title !== nombre_actividad);
    }

    // Agregar las nuevas sesiones
    sesiones.forEach((e) => {
      //console.log('Agregar sesion', e);
      const eventoFormateado: EventoCalendario = {
        id_actividad: e.id_actividad,
        id_sesion: e.id_sesion, // ✅ Usamos el id único recibido
        title: e.nombre_actividad,
        start: `${e.fecha}T${e.hora_inicio}`,
        end: `${e.fecha}T${e.hora_fin}`,
        extendedProps: { ...e },
      };

      //console.log(`➕ Agregando sesión #${i + 1}:`, eventoFormateado);

      this.eventosCalendario.push(eventoFormateado);
    });

    // Refrescar el calendario
    this.calendarOptions = {
      ...this.calendarOptions,
      events: [...this.eventosCalendario],
    };

    this.eventoEditando = null;
    this.fechaSeleccionada = null;
    this.mostrarFormulario = false;

    //console.log('✅ Sesiones actualizadas. Total en calendario:',this.eventosCalendario.length);
    //console.log('✅ Sesiones actualizadas. Total en calendario:',this.eventosCalendario);
  }

  eliminarSesionDelCalendario(id: string) {
    // Si es UUID asumimos que es una sesión individual
    const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(id);

    if (esUUID) {
      //console.log('🗑️ Eliminando sesión individual:', id);
      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.id_sesion !== id,
      );
    } else {
      //console.log('🧹 Eliminando todas las sesiones con nombre:', id);
      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.title !== id,
      );
    }

    this.calendarOptions.events = [...this.eventosCalendario];
    //console.log('📆 Sesión(es) eliminada(s). Calendario actualizado.');
  }

  // ✅ Recargar sesiones al cerrar formularios o modales
  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.eventoSeleccionado = undefined;
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

  cerrarAsistenciaFotografica() {
    // 👈 nuevo
    this.mostrarAsistenciaFotografica = false;
    this.cargarSesiones();
  }

  // 🔹 Aquí es donde decidimos si abrir normal o fotográfica
  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    //console.log('🎯 evento seleccionado 1:', this.eventoSeleccionado);
    //console.log('🎯 Accion seleccionadaaaaaaa:', accion);
    if (accion === 'editar') {
      if (this.eventoSeleccionado?.id_actividad) {
        this.eventoComponent.cargarEdicionDesdeBackend(
          this.eventoSeleccionado.id_actividad,
        );
      } else {

        this.eventoComponent.precargarFormulario({
          ...this.eventoSeleccionado,
          nombre_actividad:this.eventoSeleccionado.nombre_actividad??undefined

        })
      }
      this.mostrarFormulario = true;
      // this.abrirEdicion({
      //   event: {
      //     extendedProps: this.eventoSeleccionado,
      //     title: this.eventoSeleccionado?.nombre_actividad
      //   }
      // });
      this.mostrarModalAcciones = false;
      return;
    }

    if (accion === 'asistencia') {
      this.mostrarFormulario = false;
      this.mostrarModalAcciones = false;

      if (!this.eventoSeleccionado?.id_sesion) {
        console.warn('No hay sesión seleccionada para tomar asistencia');
        this.snack.error('No hay sesión seleccionada');
        return;
      }
      if (this.eventoSeleccionado) {
        this.asistenciaService
          .obtenerDetalleAsistencia(this.eventoSeleccionado?.id_sesion ?? '')
          .then((respuesta: PreAsistencia) => {
            // Guardamos la respuesta en el evento
            //console.log('calendar.component preasistencia:', respuesta);
            // merge seguro: garantizamos strings y arrays
            const merged: Sesiones = {
              id_actividad: this.eventoSeleccionado?.id_actividad ?? '', // si tu backend no manda id_actividad, mantiene '' por seguridad
              id_sesion:
                this.eventoSeleccionado?.id_sesion ?? respuesta.id_sesion,
              nro_asistentes:
                this.eventoSeleccionado?.nro_asistentes ??
                respuesta.numero_asistentes ??
                0,
              nombre_actividad: this.eventoSeleccionado?.nombre_actividad ?? '',
              fecha_actividad: this.eventoSeleccionado?.fecha_actividad ?? '',
              hora_inicio: this.eventoSeleccionado?.hora_inicio ?? '',
              hora_fin: this.eventoSeleccionado?.hora_fin ?? '',
            };

            this.eventoSeleccionado = merged;

            // Definir el tipo de asistencia
            this.tipoAsistencia =
              respuesta.foto === 'S' ? 'fotografica' : 'normal';

            // Mostrar modal
            this.mostrarAsistencia = true;
          })
          .catch((err) => {
            console.error('❌ Error al obtener detalle asistencia:', err);
            // Opcional: notificar con snackbar
            this.snack.error('Error al cargar detalle asistencia');
          });
      }
    }
  }
}
