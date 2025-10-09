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
import { Component, Input } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';



@Component({
  selector: 'full-calendar',
  template: '<div>Mock Calendar</div>',
  standalone: true,
})
class MockFullCalendarComponent {
  @Input() options: any;
}

describe('✅ CalendarComponent (Cobertura 90%)', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  let calendarServiceMock: jasmine.SpyObj<CalendarService>;
  let asistenciaServiceMock: jasmine.SpyObj<AsistenciaService>;
  let snackMock: jasmine.SpyObj<SnackbarService>;
  let authMock: jasmine.SpyObj<AuthService>;
  let loadingMock: jasmine.SpyObj<LoadingService>;
  let eventoComponentMock: jasmine.SpyObj<EventComponent>;
  beforeEach(async () => {
    calendarServiceMock = jasmine.createSpyObj('CalendarService', ['obtenerSesiones']);
    asistenciaServiceMock = jasmine.createSpyObj('AsistenciaService', ['obtenerDetalleAsistencia']);
    snackMock = jasmine.createSpyObj('SnackbarService', ['error', 'warning', 'success']);
    authMock = jasmine.createSpyObj('AuthService', ['getUserUuid']);
    loadingMock = jasmine.createSpyObj('LoadingService', ['show', 'hide']);
    eventoComponentMock = jasmine.createSpyObj('EventComponent', ['cargarEdicionDesdeBackend', 'precargarFormulario']);

    // ⚡ Creamos un stub temporal de CalendarComponent sin template real
    @Component({
      selector: 'app-calendar',
      template: '<div></div>', // ✅ sin <full-calendar>
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





  it('✅ debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('📅 onDatesSet() debe actualizar fechas y cargar sesiones', fakeAsync(() => {
    // 🔄 Restaurar método real solo para esta prueba
    (component as any).cargarSesiones = CalendarComponent.prototype.cargarSesiones;
    spyOn(component, 'cargarSesiones').and.stub();

    const dateInfo = {
      start: new Date('2025-01-01'),
      end: new Date('2025-01-10'),
    } as any;

    component.onDatesSet(dateInfo);
    tick();

    expect(component.ultimaFechaInicio).toBe('2025-01-01');
    expect(component.ultimaFechaFin).toBe('2025-01-10');
    expect(component.cargarSesiones).toHaveBeenCalled();
  }));

  it('🗓️ cargarSesiones() debe obtener sesiones y actualizar calendario', fakeAsync(() => {
    // 🔄 Habilitar método real
    (component as any).cargarSesiones = CalendarComponent.prototype.cargarSesiones;

    component.ultimaFechaInicio = '2025-01-01';
    component.ultimaFechaFin = '2025-01-10';
    authMock.getUserUuid.and.returnValue('user123');

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

    calendarServiceMock.obtenerSesiones.and.returnValue(Promise.resolve(mockSesiones));

    component.cargarSesiones();
    tick();

    expect(calendarServiceMock.obtenerSesiones).toHaveBeenCalledWith('2025-01-01', '2025-01-10', 'user123');
    expect(component.eventosCalendario.length).toBe(1);
  }));

  it('🗓️ cargarSesiones() no debe ejecutar si faltan fechas', () => {
    component.ultimaFechaInicio = null;
    component.ultimaFechaFin = null;
    calendarServiceMock.obtenerSesiones.calls.reset();
    component.cargarSesiones();
    expect(calendarServiceMock.obtenerSesiones).not.toHaveBeenCalled();
  });

  it('📆 handleDateClick() debe actualizar flags correctamente', () => {
    const arg = { dateStr: '2025-01-15' } as any;
    component.handleDateClick(arg);
    expect(component.fechaSeleccionada).toBe('2025-01-15');
    expect(component.mostrarFormulario).toBeTrue();
  });

  it('🎯 handleEventClick() debe construir eventoSeleccionado', () => {
    component.calendarOptions.events = [
      {
        title: 'EventoX',
        start: '2025-01-02T08:00',
        end: '2025-01-02T10:00',
        id_actividad: 'A1',
        id_sesion: 'S1',
        extendedProps: {},
      },
    ] as any;

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
    expect(component.mostrarModalAcciones).toBeTrue();
  });

  it('✏️ abrirEdicion() debe preparar datos y activar formulario', () => {
    component.calendarOptions.events = [
      { title: 'EventoY', start: '2025-01-03T08:00', end: '2025-01-03T09:00', id_actividad: 'A2', id_sesion: 'S2' },
    ] as any;

    const arg = {
      event: {
        title: 'EventoY',
        extendedProps: { id_actividad: 'A2', id_sesion: 'S2', nro_asistentes: 5 },
      },
    } as any;

    component.abrirEdicion(arg);
    expect(component.mostrarFormulario).toBeTrue();
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
    expect(component.mostrarFormulario).toBeFalse();
  });

  it('🚫 agregarOActualizarEvento() debe advertir si no hay sesiones', () => {
    spyOn(console, 'warn');
    component.agregarOActualizarEvento({ sesiones: [] });
    expect(console.warn).toHaveBeenCalled();
  });

  it('🗑 eliminarSesionDelCalendario() debe eliminar por UUID', () => {
    component.eventosCalendario = [
      { id_sesion: '123e4567-e89b-12d3-a456-426614174000', title: 'Ev' } as any,
    ];
    component.eliminarSesionDelCalendario('123e4567-e89b-12d3-a456-426614174000');
    expect(component.eventosCalendario.length).toBe(0);
  });

  it('🧹 eliminarSesionDelCalendario() debe eliminar por nombre', () => {
    component.eventosCalendario = [
      { id_sesion: 'S5', title: 'EventoW' } as any,
    ];
    component.eliminarSesionDelCalendario('EventoW');
    expect(component.eventosCalendario.length).toBe(0);
  });

  it('🔄 cerrarFormulario/cerrarModalAcciones/cerrarAsistencia/cerrarAsistenciaFotografica deben recargar sesiones', () => {
    // 🔄 Restaurar método real antes de volver a espiar
    (component as any).cargarSesiones = CalendarComponent.prototype.cargarSesiones;
    spyOn(component, 'cargarSesiones');

    component.cerrarFormulario();
    component.cerrarModalAcciones();
    component.cerrarAsistencia();
    component.cerrarAsistenciaFotografica();

    expect(component.cargarSesiones).toHaveBeenCalledTimes(4);
  });

  it('⚙️ onAccionSeleccionada("editar") debe precargar formulario', () => {
    component.eventoSeleccionado = { id_actividad: '', id_sesion: 'S1' } as any;
    component.onAccionSeleccionada('editar');
    expect(component.mostrarFormulario).toBeTrue();
    expect(component.mostrarModalAcciones).toBeFalse();
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
    asistenciaServiceMock.obtenerDetalleAsistencia.and.returnValue(Promise.resolve(preAsistencia));
    component.eventoSeleccionado = { id_actividad: 'A1', id_sesion: 'S1', nombre_actividad: 'X' } as any;

    component.onAccionSeleccionada('asistencia');
    tick();

    expect(component.mostrarAsistencia).toBeTrue();
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
    asistenciaServiceMock.obtenerDetalleAsistencia.and.returnValue(Promise.resolve(preAsistencia));
    component.eventoSeleccionado = { id_actividad: 'A2', id_sesion: 'S2', nombre_actividad: 'Y' } as any;

    component.onAccionSeleccionada('asistencia');
    tick();

    expect(component.mostrarAsistencia).toBeTrue();
    expect(component.tipoAsistencia).toBe('fotografica');
  }));

  it('💥 onAccionSeleccionada("asistencia") debe manejar error', fakeAsync(() => {
    asistenciaServiceMock.obtenerDetalleAsistencia.and.returnValue(Promise.reject('Error'));
    component.eventoSeleccionado = { id_actividad: 'A1', id_sesion: 'S1', nombre_actividad: 'Z' } as any;

    component.onAccionSeleccionada('asistencia');
    tick();

    expect(snackMock.error).toHaveBeenCalled();
  }));
});
