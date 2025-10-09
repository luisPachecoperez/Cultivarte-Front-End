import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EventComponent } from '../../app/eventos/components/event.component/pages/event.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventService } from '../../app/eventos/components/event.component/services/event.service';
import { Grid_sesionesService } from '../../app/eventos/components/grid-sesiones.component/services/grid-sesiones.service';
import { AuthService } from '../../app/shared/services/auth.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { LoadingService } from '../../app/shared/services/loading.service';


// ✅ Servicios mockeados
class EventServiceMock {
  obtenerConfiguracionEvento = jest.fn().and.returnValue({
    subscribe: (cb: any) =>
      cb({
        id_programa: 'P1',
        sedes: [{ id_sede: '1', nombre: 'Principal' }],
        tiposDeActividad: [{ id_tipo_actividad: 'T1', nombre: 'General' }],
        aliados: [{ id_aliado: 'A1', nombre: 'Aliado 1' }],
        responsables: [{ id_responsable: 'R1', nombre: 'Resp 1' }],
        nombresDeActividad: [{ nombre: 'Actividad 1', id_tipo_actividad: 'T1' }],
        frecuencias: [{ id_frecuencia: 'F1', nombre: 'Semanalmente' }],
      }),
  });

  obtenerEventoPorId = jest.fn().and.returnValue(
    Promise.resolve({
      actividad: {
        id_actividad: 'A1',
        institucional: 'S',
        id_sede: '1',
        id_tipo_actividad: 'T1',
        id_responsable: 'R1',
        id_aliado: 'A1',
        nombre_actividad: 'Evento de prueba',
        descripcion: 'Descripción',
        id_frecuencia: 'F1',
        fecha_actividad: '2025-10-06',
        hora_inicio: '08:00',
        hora_fin: '10:00',
      },
      sesiones: [
        {
          id_sesion: 'S1',
          fecha_actividad: '2025-10-06',
          hora_inicio: '08:00',
          hora_fin: '10:00',
          nro_asistentes: 15,
        },
      ],
    })
  );

  crearEvento = jest.fn().and.returnValue(
    Promise.resolve({ exitoso: 'S', mensaje: 'Evento creado correctamente' })
  );
}

class GridSesionesServiceMock {
  guardarCambiosSesiones = jasmine
    .createSpy()
    .and.returnValue(Promise.resolve({ exitoso: 'S', mensaje: 'Sesiones guardadas' }));
}

class AuthServiceMock {
  getUserUuid = jest.fn().and.returnValue('USER-1');
}

class SnackbarServiceMock {
  success = jest.fn('success');
  error = jest.fn('error');
}

class LoadingServiceMock {
  show = jest.fn('show');
  hide = jest.fn('hide');
}

describe('EventComponent (Angular 20)', () => {
  let component: EventComponent;
  let fixture: ComponentFixture<EventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        HttpClientTestingModule, // ✅ importante
      ],
      providers: [
        { provide: EventService, useClass: EventServiceMock },
        { provide: Grid_sesionesService, useClass: GridSesionesServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: SnackbarService, useClass: SnackbarServiceMock },
        { provide: LoadingService, useClass: LoadingServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('✔️ debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('🧩 debe inicializar el formulario con ngOnInit', () => {
    expect(component.eventoForm).toBeTruthy();
    expect(component.eventoForm.get('id_programa')).toBeTruthy();
  });

  it('📋 debe precargar el formulario con un evento', () => {
    const evento = {
      id_actividad: 'A1',
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Actividad demo',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'F1',
      sesiones: [],
    };
    component.precargarFormulario(evento);
    expect(component.eventoForm.get('id_sede')?.value).toBe('1');
  });

  it('💾 debe crear un evento correctamente', async () => {
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Actividad 1',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      id_frecuencia: 'F1',
    });

    await component['crearEvento']();
    expect(component['eventService'].crearEvento).toHaveBeenCalled();
  });

  it('🔁 debe actualizar sesiones correctamente', async () => {
    component['cambiosSesionesSnapshot'] = {
      nuevos: [],
      modificados: [],
      eliminados: [],
    };
    await component.actualizarSesion();
    expect(component['grid_sesionesService'].guardarCambiosSesiones).toHaveBeenCalled();
  });

  it('🧠 debe ejecutar los efectos de signals sin errores', () => {
    expect(() => {
      const fn = component['fechaPreseleccionada']();
      expect(fn).toBeNull();
    }).not.toThrow();
  });
});
