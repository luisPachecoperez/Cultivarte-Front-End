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
import { AuthService } from '../../shared/services/auth.service';
import { LoadIndexDB } from '../../indexdb/services/load-index-db.service';
import { PreAsistencia } from '../../shared/interfaces/preasistencia.model';
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
  constructor(
    private calendarService: CalendarService,
    private asistenciaService: AsistenciaService,
    private eventoComponent: EventComponent,
    private snack: SnackbarService,
    private authService: AuthService,
    private loadIndexDB: LoadIndexDB
  ) {}

  eventosCalendario: any[] = [];
  fechaSeleccionada: string | null = null;
  eventoEditando: any = null;

  eventoSeleccionado: any = null;
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
    events: [],
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

  onDatesSet(dateInfo: any) {
    this.ultimaFechaInicio = dateInfo.start.toISOString().split('T')[0];
    this.ultimaFechaFin = dateInfo.end.toISOString().split('T')[0];

    //console.log('📅 Vista del calendario:', { fechaInicio: this.ultimaFechaInicio, fechaFin: this.ultimaFechaFi });
    this.loadIndexDB.cargarDatosIniciales(this.authService.getUserUuid() || '');

    this.cargarSesiones();
  }

  cargarSesiones() {
    if (!this.ultimaFechaInicio || !this.ultimaFechaFin) return;

    const idUsuario = this.authService.getUserUuid();
    /*Antes del async
    this.calendarService.obtenerSesiones(this.ultimaFechaInicio, this.ultimaFechaFin, idUsuario)
    .subscribe({
      next: sesionesFormateadas => {
        //console.log("Sesiones formateadas",sesionesFormateadas);
        this.eventosCalendario = sesionesFormateadas;
        console.log("Sesiones cargadas:",this.eventosCalendario);
        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...this.eventosCalendario]
        };
        this.snack.success('Sesiones cargadas');
      },
      error: err => {
        this.snack.error('No fue posible cargar las sesiones');
      }
    });
    */
    //Despues del async
    this.calendarService
      .obtenerSesiones(this.ultimaFechaInicio, this.ultimaFechaFin, idUsuario)
      .then((sesionesFormateadas) => {
        this.eventosCalendario = sesionesFormateadas;
        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...this.eventosCalendario],
        };
      })
      .catch((err) => {
        console.log('No fue posible cargar las sesiones');
      });
  }

  handleDateClick(arg: any) {
    //console.log('📌 Click en fecha:', arg.dateStr);
    this.fechaSeleccionada = arg.dateStr;
    this.eventoSeleccionado = null;
    this.mostrarFormulario = true;
  }

  handleEventClick(arg: any): void {
    //console.log('🟢 Click en evento del calendario');
    //console.log('arg.event html', arg.event);

    const nombreSesion = arg.event.title;
    //console.log('nombreSesion', nombreSesion);
    //console.log('calendar options', this.calendarOptions.events);

    const eventosRelacionados = (this.calendarOptions.events as any[]).filter(
      (e) => e.title === nombreSesion
    );

    //console.log('eventosRelacionados', eventosRelacionados);

    const sesiones = eventosRelacionados.map((e) => ({
      fecha: e.start.split(' ')[0],
      horaInicio: e.start.split(' ')[1].substring(0, 5),
      horaFin: e.end.split(' ')[1].substring(0, 5),
    }));

    const primeraSesion = sesiones[0] || {
      fecha: '',
      horaInicio: '',
      horaFin: '',
    };
    //console.log('arg.event', arg.event);
    this.eventoSeleccionado = {
      // 👇 forzamos incluir los campos que vienen desde CalendarService
      id_actividad: arg.event.extendedProps.id_actividad,
      id_sesion: arg.event.id,
      asistentes_evento: arg.event.extendedProps.asistentes_evento,
      // tipo_evento: arg.event.extendedProps.tipo_evento,
      nombreSesion,
      sesiones,
      fecha: primeraSesion.fecha,
      horaInicio: primeraSesion.horaInicio,
      horaFin: primeraSesion.horaFin,
    };

    //console.log('🎯 Evento seleccionado para acciones:', this.eventoSeleccionado);
    this.mostrarModalAcciones = true;
  }

  abrirEdicion(eventoCalendario: any) {
    const nombreSesion = eventoCalendario.event.title;
    const eventosRelacionados = (this.calendarOptions.events as any[]).filter(
      (e) => e.title === nombreSesion
    );

    const sesiones = eventosRelacionados.map((e) => ({
      fecha: e.start.split(' ')[0],
      horaInicio: e.start.split(' ')[1].substring(0, 5),
      horaFin: e.end.split(' ')[1].substring(0, 5),
    }));
    //console.log('🎯 Evento seleccionado para edicion:2', eventoCalendario.event);
    this.eventoSeleccionado = {
      id_actividad: eventoCalendario.event.extendedProps.id_actividad,
      id_sesion: eventoCalendario.event.extendedProps.id_sesion,
      asistentes_evento: eventoCalendario.event.extendedProps.asistentes_evento,
      tipo_evento: eventoCalendario.event.extendedProps.tipo_evento,
      nombreSesion,
      sesiones,
      fecha: sesiones[0]?.fecha || '',
      horaInicio: sesiones[0]?.horaInicio || '',
      horaFin: sesiones[0]?.horaFin || '',
    };

    this.mostrarFormulario = true;
  }

  agregarOActualizarEvento(evento: any): void {
    //console.log('agregar o actualizar:');
    const { sesiones, editarUna, idSesionOriginal } = evento;

    if (!Array.isArray(sesiones) || sesiones.length === 0) {
      console.warn('⚠️ No hay sesiones para agregar o actualizar.');
      return;
    }

    const nombreSesion = sesiones[0].nombreSesion;
    //console.log('🔁 Procesando sesiones para:', nombreSesion);

    if (editarUna && idSesionOriginal) {
      //console.log('🛠 Editando solo una sesión:', idSesionOriginal);

      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.id !== idSesionOriginal
      );
      this.calendarOptions.events = (
        this.calendarOptions.events as any[]
      ).filter((ev) => ev.id !== idSesionOriginal);

      //console.log('🗑️ Eliminada sesión con ID:', idSesionOriginal);
    } else if (!editarUna) {
      //console.log('🧹 Reemplazando todas las sesiones de:', nombreSesion);

      const eliminadas = this.eventosCalendario.filter(
        (ev) => ev.title === nombreSesion
      );
      eliminadas.forEach((ev) => console.log('🗑️ Eliminada:', ev.id));

      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.title !== nombreSesion
      );
      this.calendarOptions.events = (
        this.calendarOptions.events as any[]
      ).filter((ev) => ev.title !== nombreSesion);
    }

    // Agregar las nuevas sesiones
    sesiones.forEach((e, i) => {
      //console.log('Agregar sesion', e);
      const eventoFormateado = {
        id: e.id, // ✅ Usamos el id único recibido
        title: e.nombreSesion,
        start: `${e.fecha}T${e.horaInicio}`,
        end: `${e.fecha}T${e.horaFin}`,
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
  }
  eliminarSesionDelCalendario(id: string) {
    // Si es UUID asumimos que es una sesión individual
    const esUUID = /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(id);

    if (esUUID) {
      //console.log('🗑️ Eliminando sesión individual:', id);
      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.id !== id
      );
    } else {
      //console.log('🧹 Eliminando todas las sesiones con nombre:', id);
      this.eventosCalendario = this.eventosCalendario.filter(
        (ev) => ev.title !== id
      );
    }

    this.calendarOptions.events = [...this.eventosCalendario];
    //console.log('📆 Sesión(es) eliminada(s). Calendario actualizado.');
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

  cerrarAsistenciaFotografica() {
    // 👈 nuevo
    this.mostrarAsistenciaFotografica = false;
    this.cargarSesiones();
  }

  // 🔹 Aquí es donde decidimos si abrir normal o fotográfica
  onAccionSeleccionada(accion: 'editar' | 'asistencia') {
    console.log('🎯 evento seleccionado 1:', this.eventoSeleccionado);
    //console.log('🎯 Accion seleccionadaaaaaaa:', accion);
    if (accion === 'editar') {
      if (this.eventoSeleccionado?.id_actividad) {
        this.eventoComponent.cargarEdicionDesdeBackend(
          this.eventoSeleccionado.id_actividad
        );
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

      this.asistenciaService
        .obtenerDetalleAsistencia(this.eventoSeleccionado.id_sesion)
        .then((respuesta: PreAsistencia) => {
          // Guardamos la respuesta en el evento
          console.log("calendar.component preasistencia:",respuesta);
          this.eventoSeleccionado = {
            ...this.eventoSeleccionado,
            ...respuesta,
          };

          // Definir el tipo de asistencia
          this.tipoAsistencia =
            respuesta.foto === 'S' ? 'fotografica' : 'normal';

          // Mostrar modal
          this.mostrarAsistencia = true;
        })
        .catch((err) => {
          console.error('❌ Error al obtener detalle asistencia:', err);
          // Opcional: notificar con snackbar
          // this.snackBar.open('Error al cargar detalle asistencia', 'Cerrar', { duration: 3000 });
        });
    }
    /*sin async
      this.asistenciaService
        .obtenerDetalleAsistencia(this.eventoSeleccionado.id_sesion)
        .subscribe((respuesta) => {
          //console.log('📥 Respuesta detalle asistencia:', respuesta);

          // Guardamos la respuesta en el evento
          this.eventoSeleccionado = {
            ...this.eventoSeleccionado,
            ...respuesta,
          };

          // Definir el tipo de asistencia
          this.tipoAsistencia =
            respuesta.foto === 'S' ? 'fotografica' : 'normal';

          // Mostrar modal
          this.mostrarAsistencia = true;
        });
    }*/
  }
}
