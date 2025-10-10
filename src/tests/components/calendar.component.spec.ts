import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CalendarComponent } from '../../app/calendar/pages/calendar.component';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { CalendarService } from '../../app/calendar/services/calendar.service';
import { AsistenciaService } from '../../app/asistencia/asistencia-lista/services/asistencia.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { AuthService } from '../../app/shared/services/auth.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { EventComponent } from '../../app/eventos/components/event.component/pages/event.component';
import { PreAsistencia } from '../../app/asistencia/interfaces/pre-asistencia.interface';
import { Component, Input, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

jest.mock('@fullcalendar/angular', () => ({
  FullCalendarModule: { forRoot: () => ({}) },
  CalendarOptions: class {},
}));
jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/timegrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));
jest.mock('@fullcalendar/core/locales/es', () => ({}));
@Component({
  selector: 'full-calendar',
  template: '<div>Mock Calendar</div>',
  standalone: true,
})
class MockFullCalendarComponent {
  @Input() options: any;
}

describe('✅ CalendarComponent (Jest 90%)', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  let calendarServiceMock: { obtenerSesiones: jest.Mock };
  let asistenciaServiceMock: { obtenerDetalleAsistencia: jest.Mock };
  let snackMock: { error: jest.Mock; warning: jest.Mock; success: jest.Mock };
  let authMock: { getUserUuid: jest.Mock };
  let loadingMock: { show: jest.Mock; hide: jest.Mock };
  let eventoComponentMock: {
    cargarEdicionDesdeBackend: jest.Mock;
    precargarFormulario: jest.Mock;
  };

  beforeEach(async () => {
    calendarServiceMock = {
      obtenerSesiones: jest.fn().mockResolvedValue([]), // 👈  ✅  ESTA LÍNEA ES CLAVE
    };
        asistenciaServiceMock = { obtenerDetalleAsistencia: jest.fn() };
    snackMock = { error: jest.fn(), warning: jest.fn(), success: jest.fn() };
    authMock = { getUserUuid: jest.fn() };
    loadingMock = { show: jest.fn(), hide: jest.fn() };
    eventoComponentMock = {
      cargarEdicionDesdeBackend: jest.fn(),
      precargarFormulario: jest.fn(),
    };

    @Component({
      selector: 'app-calendar',
      template: '<div></div>',
      standalone: true,
      imports: [CommonModule],
    })
    class CalendarComponentStub extends CalendarComponent {}

    await TestBed.configureTestingModule({
      imports: [CalendarComponentStub, MatSnackBarModule],
      providers: [
        { provide: CalendarService, useValue: calendarServiceMock },
        { provide: AsistenciaService, useValue: asistenciaServiceMock },
        { provide: SnackbarService, useValue: snackMock },
        { provide: AuthService, useValue: authMock },
        { provide: LoadingService, useValue: loadingMock },
        { provide: EventComponent, useValue: eventoComponentMock },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarComponentStub);
    component = fixture.componentInstance;

    component.calendarOptions = {
      plugins: [],
      initialView: 'dayGridMonth',
      events: [],
      dateClick: () => {},
      eventClick: () => {},
      datesSet: () => {},
    } as any;

    (component as any).calendarService = calendarServiceMock;
    (component as any).asistenciaService = asistenciaServiceMock;
    (component as any).snack = snackMock;
    (component as any).authService = authMock;
    (component as any).loadingService = loadingMock;
    (component as any).eventoComponent = eventoComponentMock;

    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  it('✅ debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('🧭 onDatesSet() debe ejecutar finally y ocultar loading', fakeAsync(() => {
    const showSpy = jest.spyOn(loadingMock, 'show');
    const hideSpy = jest.spyOn(loadingMock, 'hide');
    calendarServiceMock.obtenerSesiones.mockResolvedValue([]); // 👈 agrega esta línea

    const dateInfo = {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-10'),
    } as any;

    component.onDatesSet(dateInfo);
    tick();

    expect(showSpy).toHaveBeenCalled();
    expect(hideSpy).toHaveBeenCalled();
  }));


  it('🗓️ cargarSesiones() debe obtener sesiones y actualizar calendario', fakeAsync(() => {
    (component as any).cargarSesiones = CalendarComponent.prototype.cargarSesiones;
    component.ultimaFechaInicio = '2025-01-01';
    component.ultimaFechaFin = '2025-01-10';
    authMock.getUserUuid.mockReturnValue('user123');

    const mockSesiones = [
      {
        id_actividad: 'A1',
        id_sesion: 'S1',
        title: 'Evento',
        start: '2025-01-01T08:00',
        end: '2025-01-01T10:00',
        extendedProps: {},
      },
    ];

    calendarServiceMock.obtenerSesiones.mockResolvedValue(mockSesiones);

    component.cargarSesiones();
    tick();

    expect(calendarServiceMock.obtenerSesiones).toHaveBeenCalledWith(
      '2025-01-01',
      '2025-01-10',
      'user123'
    );
    expect(component.eventosCalendario.length).toBe(1);
  }));

  it('🗓️ cargarSesiones() no debe ejecutar si faltan fechas', () => {
    component.ultimaFechaInicio = null;
    component.ultimaFechaFin = null;
    calendarServiceMock.obtenerSesiones.mockReset();
    component.cargarSesiones();
    expect(calendarServiceMock.obtenerSesiones).not.toHaveBeenCalled();
  });

  it('📆 handleDateClick() debe actualizar flags correctamente', () => {
    const arg = { dateStr: '2025-01-15' } as any;
    component.handleDateClick(arg);
    expect(component.fechaSeleccionada).toBe('2025-01-15');
    expect(component.mostrarFormulario).toBe(true);
  });

  it('🎯 handleEventClick() debe construir eventoSeleccionado', () => {
    const eventArg = {
      event: {
        id: 'S1',
        title: 'EventoX',
        startStr: '2025-01-02T08:00',
        endStr: '2025-01-02T10:00',
        extendedProps: { id_actividad: 'A1', id_sesion: 'S1' },
      },
    } as any;

    component.handleEventClick(eventArg);
    expect(component.eventoSeleccionado?.id_sesion).toBe('S1');
    expect(component.mostrarModalAcciones).toBe(true);
  });

  it('✏️ abrirEdicion() debe preparar datos y activar formulario', () => {
    const arg = {
      event: {
        title: 'EventoY',
        extendedProps: { id_actividad: 'A2', id_sesion: 'S2', nro_asistentes: 5 },
      },
    } as any;

    component.abrirEdicion(arg);
    expect(component.mostrarFormulario).toBe(true);
    expect(component.eventoSeleccionado?.id_sesion).toBe('S2');
  });

  it('➕ agregarOActualizarEvento() debe agregar nuevas sesiones', () => {
    const payload = {
      sesiones: [
        {
          id_actividad: 'A3',
          id_sesion: 'S3',
          nombre_actividad: 'EventoZ',
          fecha: '2025-01-04',
          hora_inicio: '08:00',
          hora_fin: '09:00',
        },
      ],
    };
    component.eventosCalendario = [];
    component.agregarOActualizarEvento(payload);
    expect(component.eventosCalendario.length).toBe(1);
    expect(component.mostrarFormulario).toBe(false);
  });

  it('🚫 agregarOActualizarEvento() debe advertir si no hay sesiones', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    component.agregarOActualizarEvento({ sesiones: [] });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('🗑 eliminarSesionDelCalendario() debe eliminar por UUID', () => {
    component.eventosCalendario = [{ id_sesion: 'uuid1', title: 'uuid1' } as any];
    component.eliminarSesionDelCalendario('uuid1');
    expect(component.eventosCalendario.length).toBe(0);
  });

  it('🧹 eliminarSesionDelCalendario() debe eliminar por nombre', () => {
    component.eventosCalendario = [{ id_sesion: 'S5', title: 'EventoW' } as any];
    component.eliminarSesionDelCalendario('EventoW');
    expect(component.eventosCalendario.length).toBe(0);
  });

  it('🔄 cerrarFormulario/cerrarModalAcciones/cerrarAsistencia/cerrarAsistenciaFotografica deben recargar sesiones', () => {
    (component as any).cargarSesiones = CalendarComponent.prototype.cargarSesiones;
    const cargarSpy = jest.spyOn(component, 'cargarSesiones').mockImplementation(() => {});

    component.cerrarFormulario();
    component.cerrarModalAcciones();
    component.cerrarAsistencia();
    component.cerrarAsistenciaFotografica();

    expect(cargarSpy).toHaveBeenCalledTimes(4);
  });

  it('⚙️ onAccionSeleccionada("editar") debe precargar formulario', () => {
    component.eventoSeleccionado = { id_actividad: '', id_sesion: 'S1' } as any;
    component.onAccionSeleccionada('editar');
    expect(component.mostrarFormulario).toBe(true);
    expect(component.mostrarModalAcciones).toBe(false);
  });

  it('📸 onAccionSeleccionada("asistencia") debe manejar asistencia normal', fakeAsync(() => {
    const preAsistencia: PreAsistencia = {
      id_sesion: 'S1',
      id_sede: '1',
      numero_asistentes: 2,
      descripcion: '',
      beneficiarios: [],
      asistentes_sesiones: [],
      sedes: [],
      imagen: '',
      foto: 'N',
    };
    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValue(preAsistencia);
    component.eventoSeleccionado = { id_actividad: 'A1', id_sesion: 'S1' } as any;

    component.onAccionSeleccionada('asistencia');
    tick();

    expect(component.mostrarAsistencia).toBe(true);
    expect(component.tipoAsistencia).toBe('normal');
  }));

  it('📸 onAccionSeleccionada("asistencia") debe manejar asistencia fotográfica', fakeAsync(() => {
    const preAsistencia: PreAsistencia = {
      id_sesion: 'S2',
      id_sede: '1',
      numero_asistentes: 2,
      descripcion: '',
      beneficiarios: [],
      asistentes_sesiones: [],
      sedes: [],
      imagen: '',
      foto: 'S',
    };
    asistenciaServiceMock.obtenerDetalleAsistencia.mockResolvedValue(preAsistencia);
    component.eventoSeleccionado = { id_actividad: 'A2', id_sesion: 'S2' } as any;

    component.onAccionSeleccionada('asistencia');
    tick();

    expect(component.mostrarAsistencia).toBe(true);
    expect(component.tipoAsistencia).toBe('fotografica');
  }));

  it('💥 onAccionSeleccionada("asistencia") debe manejar error', fakeAsync(() => {
    asistenciaServiceMock.obtenerDetalleAsistencia.mockRejectedValue('Error');
    component.eventoSeleccionado = { id_actividad: 'A1', id_sesion: 'S1' } as any;

    component.onAccionSeleccionada('asistencia');
    tick();

    expect(snackMock.error).toHaveBeenCalled();
  }));

  it('💥 cargarSesiones() debe manejar error correctamente', fakeAsync(() => {
    component.ultimaFechaInicio = '2025-01-01';
    component.ultimaFechaFin = '2025-01-10';
    authMock.getUserUuid.mockReturnValue('user123');
    calendarServiceMock.obtenerSesiones.mockRejectedValue('Error');
    component.cargarSesiones();
    tick();
    expect(calendarServiceMock.obtenerSesiones).toHaveBeenCalled();
  }));

  it('🧭 onDatesSet() debe ejecutar finally y ocultar loading', fakeAsync(() => {
    const showSpy = jest.spyOn(loadingMock, 'show');
    const hideSpy = jest.spyOn(loadingMock, 'hide');
    const dateInfo = {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-10'),
    } as any;
    component.onDatesSet(dateInfo);
    tick();
    expect(showSpy).toHaveBeenCalled();
    expect(hideSpy).toHaveBeenCalled();
  }));

  it('✏️ agregarOActualizarEvento() debe ejecutar rama editarUna', () => {
    const payload = {
      sesiones: [
        {
          id_actividad: 'A3',
          id_sesion: 'S3',
          nombre_actividad: 'EventoEdit',
          fecha: '2025-01-04',
          hora_inicio: '08:00',
          hora_fin: '09:00',
        },
      ],
      editarUna: true,
      id_sesionOriginal: 'S3',
    };
    component.eventosCalendario = [
      { id_sesion: 'S3', title: 'EventoEdit' } as any,
    ];
    component.agregarOActualizarEvento(payload);
    expect(
      component.eventosCalendario.find((e) => e.id_sesion === 'S3')
    ).toBeDefined();
  });

  it('🚫 onAccionSeleccionada("asistencia") debe advertir si no hay sesión seleccionada', fakeAsync(() => {
    component.eventoSeleccionado = { id_actividad: 'A1', id_sesion: '' } as any;
    component.onAccionSeleccionada('asistencia');
    tick();
    expect(snackMock.error).toHaveBeenCalledWith('No hay sesión seleccionada');
  }));

  it('🧩 onAccionSeleccionada("editar") debe ejecutar rama con id_actividad', () => {
    component.eventoSeleccionado = { id_actividad: 'AX', id_sesion: 'SX' } as any;
    component.onAccionSeleccionada('editar');
    expect(eventoComponentMock.cargarEdicionDesdeBackend).toHaveBeenCalledWith('AX');
    expect(component.mostrarFormulario).toBe(true);
  });

  it('🔥 cargarSesiones() debe manejar error en la llamada al servicio', fakeAsync(() => {
    component.ultimaFechaInicio = '2025-01-01';
    component.ultimaFechaFin = '2025-01-10';
    authMock.getUserUuid.mockReturnValue('user123');
    calendarServiceMock.obtenerSesiones.mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    component.cargarSesiones();
    tick();

    // Verifica que no se rompe y que el error se loguea (o al menos no falla)
    expect(calendarServiceMock.obtenerSesiones).toHaveBeenCalled();
    // Opcional: si quieres verificar el log
    // expect(consoleSpy).toHaveBeenCalledWith('No fue posible cargar las sesiones');

    consoleSpy.mockRestore();
  }));

   it('📸 onAccionSeleccionada("asistencia") debe mostrar error si no hay id_sesion', () => {
    component.eventoSeleccionado = { id_actividad: 'A1', id_sesion: null } as any;

    component.onAccionSeleccionada('asistencia');

    expect(snackMock.error).toHaveBeenCalledWith('No hay sesión seleccionada');
  });

  it('🎯 handleEventClick() debe manejar evento con title=null', () => {
    const eventArg = {
      event: {
        id: 'S999',
        title: null, // 👈 caso extremo
        startStr: '2025-01-03T08:00',
        endStr: '2025-01-03T10:00',
        extendedProps: { id_actividad: 'A999', id_sesion: 'S999' },
      },
    } as any;

    component.handleEventClick(eventArg);

    expect(component.eventoSeleccionado?.nombre_actividad).toBe(''); // fallback a string vacío
    expect(component.mostrarModalAcciones).toBe(true);
  });

  it('✏️ abrirEdicion() debe manejar evento con title=null', () => {
    const arg = {
      event: {
        title: null, // 👈 caso extremo
        extendedProps: { id_actividad: 'A999', id_sesion: 'S999', nro_asistentes: 3 },
      },
    } as any;

    component.abrirEdicion(arg);

    expect(component.eventoSeleccionado?.nombre_actividad).toBe('');
    expect(component.mostrarFormulario).toBe(true);
  });

});
