import { NO_ERRORS_SCHEMA } from '@angular/core';
import { expect as jestExpect } from '@jest/globals';

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { EventModalComponent } from '../../app/eventos/components/event-modal.component/pages/event-modal.component';
import { of, Subject } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { EventModalService } from '../../app/eventos/components/event-modal.component/services/event-modal.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { Actividades } from '../../app/eventos/interfaces/actividades.interface';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';

import { By } from '@angular/platform-browser';

// Helper para simular inputs en pruebas (Angular 17+ signals)
function setInput<T>(component: any, inputName: string, value: T): void {
  Object.defineProperty(component, inputName, {
    value: () => value,
    configurable: true,
    writable: true,
  });
}

// Mock de Bootstrap Tooltip (evita errores en Node.js)
jest.mock('bootstrap', () => ({
  Tooltip: jest.fn().mockImplementation(() => ({
    // Puedes dejarlo vacío; solo necesitamos que no falle
  })),
}));

describe('EventModalComponent', () => {
  let component: EventModalComponent;
  let fixture: ComponentFixture<EventModalComponent>;
  let eventModalService: jest.Mocked<EventModalService>;
  let snackbarService: jest.Mocked<SnackbarService>;
  let loadingService: jest.Mocked<LoadingService>;

  // ✅ Mocks completos con horas
  const mockActividad: Actividades = {
    id_actividad: '123',
    nombre_actividad: 'Evento de prueba',
    asistentes_evento: 0,
    fecha_actividad: '2024-05-01',
    hora_inicio: '09:00',
    hora_fin: '10:00',
  };

  const mockSesion: Sesiones = {
    id_sesion: '456',
    id_actividad: '123',
    nombre_actividad: 'Sesión de prueba',
    nro_asistentes: 0,
    fecha_actividad: '2024-05-01',
    hora_inicio: '09:00',
    hora_fin: '10:00',
  };

  let confirmSubject: Subject<boolean>;

  beforeEach(async () => {
    confirmSubject = new Subject<boolean>();

    // ✅ SnackbarService corregido: todos los métodos son mocks
    const snackbarServiceMock = {
      success: jest.fn(),
      error: jest.fn(),
      confirm: jest.fn(() => confirmSubject.asObservable()), // ✅ ahora sí es mock
      resolveConfirm: (result: boolean) => {
        confirmSubject.next(result);
        confirmSubject.complete();
      },
    } as unknown as jest.Mocked<SnackbarService>;

    // ✅ Demás mocks
    const eventModalServiceMock = {
      eliminarEvento: jest.fn(),
    } as unknown as jest.Mocked<EventModalService>;

    const loadingServiceMock = {
      show: jest.fn(),
      hide: jest.fn(),
      reset: jest.fn(),
      loading$: of(false),
    } as unknown as jest.Mocked<LoadingService>;

    await TestBed.configureTestingModule({
      imports: [EventModalComponent],
      providers: [
        { provide: EventModalService, useValue: eventModalServiceMock },
        { provide: SnackbarService, useValue: snackbarServiceMock },
        { provide: LoadingService, useValue: loadingServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;

    eventModalService = TestBed.inject(
      EventModalService,
    ) as jest.Mocked<EventModalService>;
    snackbarService = TestBed.inject(
      SnackbarService,
    ) as jest.Mocked<SnackbarService>;
    loadingService = TestBed.inject(
      LoadingService,
    ) as jest.Mocked<LoadingService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit', () => {
    it('should initialize Bootstrap tooltips', () => {
      // Creamos un elemento falso con el atributo de tooltip
      const mockEl = document.createElement('span');
      mockEl.setAttribute('data-bs-toggle', 'tooltip');
      mockEl.setAttribute('title', 'Test tooltip');
      document.body.appendChild(mockEl);

      component.ngAfterViewInit();

      expect(require('bootstrap').Tooltip).toHaveBeenCalledWith(mockEl);

      // Limpiamos
      document.body.removeChild(mockEl);
    });
  });

  describe('seleccionarAccion', () => {
    it('should emit "editar" and close when editing', () => {
      const accionSpy = jest.fn();
      const cerrarSpy = jest.fn();
      component.accionSeleccionada.subscribe(accionSpy);
      component.cerrar.subscribe(cerrarSpy);

      component.seleccionarAccion('editar');

      expect(accionSpy).toHaveBeenCalledWith('editar');
      expect(cerrarSpy).toHaveBeenCalled();
    });

    it('should emit "asistencia" and close when marking attendance', () => {
      const accionSpy = jest.fn();
      const cerrarSpy = jest.fn();
      component.accionSeleccionada.subscribe(accionSpy);
      component.cerrar.subscribe(cerrarSpy);

      component.seleccionarAccion('asistencia');

      expect(accionSpy).toHaveBeenCalledWith('asistencia');
      expect(cerrarSpy).toHaveBeenCalled();
    });
  });

  describe('eliminarEvento', () => {
    beforeEach(() => {
      setInput(component, 'evento', mockActividad);
    });

    it('should do nothing if evento is null', async () => {
      setInput(component, 'evento', null);
      await component.eliminarEvento();
      expect(snackbarService.confirm).not.toHaveBeenCalled();
      expect(loadingService.show).not.toHaveBeenCalled();
    });

    it('should do nothing if evento is undefined', async () => {
      setInput(component, 'evento', undefined);
      await component.eliminarEvento();
      expect(snackbarService.confirm).not.toHaveBeenCalled();
    });

    it('should not proceed if user cancels confirmation', async () => {
      const promise = component.eliminarEvento();
      snackbarService.resolveConfirm(false);
      await promise;

      expect(eventModalService.eliminarEvento).not.toHaveBeenCalled();
    });

    it('should handle backend failure (exito = "N")', fakeAsync(async () => {
      snackbarService.confirm.mockReturnValueOnce(of(true)); // ✅ sin Subject
      eventModalService.eliminarEvento.mockResolvedValueOnce({
        exitoso: 'N',
        mensaje: 'No se puede eliminar: hay asistentes',
      });

      await component.eliminarEvento();
      let nestedTimeoutInvoked = false;
      function funcWithNestedTimeout() {
        setTimeout(() => {
          nestedTimeoutInvoked = true;
        });
      }
      setTimeout(funcWithNestedTimeout);

      expect(snackbarService.error).toHaveBeenCalledWith(
        'No se puede eliminar: hay asistentes',
      );
      expect(loadingService.hide).toHaveBeenCalled();
    }));

    it('should handle network error during deletion', async () => {
      snackbarService.confirm.mockReturnValueOnce(confirmSubject.asObservable());
      eventModalService.eliminarEvento.mockRejectedValueOnce(
        new Error('Network error'),
      );

      const promise = component.eliminarEvento();
      snackbarService.resolveConfirm(true);
      await promise;

      // ✅ Toma el argumento real y verifica su contenido
      const [[arg]] = (snackbarService.error as jest.Mock).mock.calls;
      const message = arg instanceof Error ? arg.message : arg;
      expect(message).toContain('Network error');

      expect(loadingService.hide).toHaveBeenCalled();
    });

    it('should work with Sesiones input (uses id_actividad)', async () => {
      setInput(component, 'evento', mockSesion);
      snackbarService.confirm.mockReturnValueOnce(
        confirmSubject.asObservable(),
      );
      eventModalService.eliminarEvento.mockResolvedValueOnce({
        exitoso: 'S',
        mensaje: 'OK',
      });

      const promise = component.eliminarEvento();
      snackbarService.resolveConfirm(true);
      await promise;

      expect(eventModalService.eliminarEvento).toHaveBeenCalledWith('123'); // id_actividad desde Sesiones
    });
  });

  describe('Template interactions', () => {
    beforeEach(() => {
      // ✅ Necesario para que el template muestre los botones
      setInput(component, 'evento', mockActividad);
      fixture.detectChanges(); // 👈 renderiza el template
    });

    it('should call seleccionarAccion("editar") on edit button click', () => {
      setInput(component, 'evento', mockActividad); // importante
      fixture.detectChanges();                      // renderiza el template

      const spy = jest.spyOn(component, 'seleccionarAccion');
      const editBtn = fixture.debugElement.query(By.css('.btn-outline-primary'));
      expect(editBtn).not.toBeNull(); // por si acaso
      editBtn.nativeElement.click();
      expect(spy).toHaveBeenCalledWith('editar');
    });
  });
});
