import { PreAsistencia } from '../../asistencia/interfaces/pre-asistencia.interface';
import { Component, inject, viewChild } from '@angular/core';
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
import { CalendarService } from '../services/calendar.service';
import { AsistenciaFotograficaComponent } from '../../asistencia/asistencia-fotografica/pages/asistencia-fotografica.component';
import { AsistenciaService } from '../../asistencia/asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { AuthService } from '../../shared/services/auth.service';
import { LoadingService } from '../../shared/services/loading.service';
import { EventoCalendario } from '../interfaces/evento-calendario.interface';
import { Sesiones } from '../../eventos/interfaces/sesiones.interface';
import { RegisBeneficiarioComponent } from '../../beneficiarios/registro/page/regis_beneficiario.component';
import { Router } from '@angular/router';

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
    RegisBeneficiarioComponent, // <-- agrega aquí el componente de beneficiarios
  ],
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  readonly eventoComponent = viewChild(EventComponent);

  // inyecciones usando `inject()`
  private readonly calendarService = inject(CalendarService);
  private readonly asistenciaService = inject(AsistenciaService);
  //private readonly eventoComponent = inject(EventComponent); // <- atención (ver nota abajo)
  private readonly snack = inject(SnackbarService);
  private readonly authService = inject(AuthService);
  private readonly loadingService = inject(LoadingService); // 👈 usado en el template
  private readonly router = inject(Router);

  eventosCalendario: EventoCalendario[] = [];
  fechaSeleccionada: string | null = null;
  eventoEditando: EventoCalendario | null = null;

  eventoSeleccionado: Sesiones | null = null;
  mostrarModalAcciones: boolean = false;
  mostrarFormulario: boolean = false;
  mostrarAsistencia: boolean = false;
  mostrarAsistenciaFotografica: boolean = false;
  mostrarRegistroBeneficiario: boolean = false;

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
    this.loadingService.show(); // 🔄 mostrar
    try {
      this.ultimaFechaInicio = dateInfo.start.toISOString().split('T')[0];
      this.ultimaFechaFin = dateInfo.end.toISOString().split('T')[0];

      this.cargarSesiones();
    } finally {
      this.loadingService.hide(); // 🔄 mostrar
    }
  }

  mapEventosRelacionados(nombre_actividad: string): Sesiones[] {
    return (this.calendarOptions.events as EventoCalendario[])
      .filter((e) => e.title === nombre_actividad)
      .map((e) => {
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
  }
  public filterEventos(key: 'id_sesion' | 'title', value: string) {
    this.eventosCalendario = this.eventosCalendario.filter(
      (ev) => ev[key] !== value,
    );
    this.calendarOptions.events = (
      this.calendarOptions.events as EventoCalendario[]
    ).filter((ev) => ev[key] !== value);
  }

  // 🔧 Unifica la lógica de cierre + recarga
  private resetAndReload(
    flag:
      | 'mostrarFormulario'
      | 'mostrarModalAcciones'
      | 'mostrarAsistencia'
      | 'mostrarAsistenciaFotografica',
  ): void {
    switch (flag) {
      case 'mostrarFormulario':
        this.mostrarFormulario = false;
        this.eventoSeleccionado = null;
        break;

      case 'mostrarModalAcciones':
        this.mostrarModalAcciones = false;
        break;

      case 'mostrarAsistencia':
        this.mostrarAsistencia = false;
        break;

      case 'mostrarAsistenciaFotografica':
        this.mostrarAsistenciaFotografica = false;
        break;
    }

    this.cargarSesiones();
  }
  cargarSesiones() {
    if (!this.ultimaFechaInicio || !this.ultimaFechaFin) return;

    const idUsuario = this.authService.getUserUuid();

    this.calendarService
      .obtenerSesiones(this.ultimaFechaInicio, this.ultimaFechaFin, idUsuario)
      .then((sesionesFormateadas) => {
        this.eventosCalendario = sesionesFormateadas;
        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...this.eventosCalendario],
        };
      })
      .catch(() => {
        console.log('No fue posible cargar las sesiones');
      });
  }

  handleDateClick(arg: DateClickMinimal) {
    this.fechaSeleccionada = arg.dateStr;
    this.eventoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  handleEventClick(arg: EventClickArg): void {
    const event = arg.event;
    // startStr y endStr son strings; preferibles a event.start (Date | null)
    const startStr = event.startStr ?? '';
    const endStr = event.endStr ?? '';
    const nombre_actividad = event.title ?? '';

    const sesiones = this.mapEventosRelacionados(nombre_actividad);

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

    this.mostrarModalAcciones = true;
  }

  abrirEdicion(sesionCalendario: EventClickMinimal) {
    const nombre_actividad = sesionCalendario.event.title ?? '';

    // Construir sesiones (fecha/hora separadas)
    const sesiones = this.mapEventosRelacionados(nombre_actividad);

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
    const { sesiones, editarUna, id_sesionOriginal } = evento;

    if (!Array.isArray(sesiones) || sesiones.length === 0) {
      console.warn('⚠️ No hay sesiones para agregar o actualizar.');
      return;
    }

    const nombre_actividad = sesiones[0].nombre_actividad;

    if (editarUna && id_sesionOriginal) {
      this.filterEventos('id_sesion', id_sesionOriginal);
    } else if (!editarUna) {
      this.filterEventos('title', nombre_actividad);
    }

    // Agregar las nuevas sesiones
    sesiones.forEach((e) => {
      const eventoFormateado: EventoCalendario = {
        id_actividad: e.id_actividad,
        id_sesion: e.id_sesion, // ✅ Usamos el id único recibido
        title: e.nombre_actividad,
        start: `${e.fecha}T${e.hora_inicio}`,
        end: `${e.fecha}T${e.hora_fin}`,
        extendedProps: { ...e },
      };

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
  }

  eliminarSesionDelCalendario(id: string) {
    // Si es UUID asumimos que es una sesión individual
    const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(id);

    if (esUUID) {
      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.id_sesion !== id,
      );
    } else {
      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.title !== id,
      );
    }

    this.calendarOptions.events = [...this.eventosCalendario];
  }

  // ✅ Recargar sesiones al cerrar formularios o modales

  cerrarFormulario() {
    this.resetAndReload('mostrarFormulario');
  }
  cerrarModalAcciones() {
    this.resetAndReload('mostrarModalAcciones');
  }
  cerrarAsistencia() {
    this.resetAndReload('mostrarAsistencia');
  }
  cerrarAsistenciaFotografica() {
    this.resetAndReload('mostrarAsistenciaFotografica');
  }
  cerrarRegistroBeneficiario(): void {
    this.mostrarRegistroBeneficiario = false;
  }

  abrirRegistroBeneficiario(): void {
    // Aquí mostrarás el nuevo grid (por ejemplo, activando un modal o toggle)
    this.mostrarRegistroBeneficiario = true;
  }

  irARegistroBeneficiario(): void {
    this.router.navigate(['/v1/culti/beneficiarios']);
  }

  irAExcepciones(): void {
    // Asegúrate de que la ruta esté bien escrita y exista en tu app-routing.module.ts
    this.router.navigate(['/v1/culti/excepciones']);
  }

  // 🔹 Aquí es donde decidimos si abrir normal o fotográfica
  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    if (accion === 'editar') {
      if (!this.eventoSeleccionado) {
        this.snack.error('No hay evento seleccionado');
        return;
      }

      // 🔹 Activar primero el formulario para que Angular cree <app-event>
      this.mostrarFormulario = true;
      this.mostrarModalAcciones = false;

      // 🔹 Esperar a que Angular actualice el DOM (deja que renderice <app-event>)
      Promise.resolve().then(() => {
        // Cuando Angular haya renderizado el hijo, el ViewChild ya no es undefined
        if (!this.eventoComponent) {
          console.warn('⚠️ El EventComponent aún no se ha inicializado.');
          return;
        }

        // 🔹 Lógica de carga real
        if (this.eventoSeleccionado?.id_actividad) {
          this.eventoComponent()?.cargarEdicionDesdeBackend(
            this.eventoSeleccionado.id_actividad,
          );
        } else {
          this.eventoComponent()?.precargarFormulario(this.eventoSeleccionado);
        }
      });

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
