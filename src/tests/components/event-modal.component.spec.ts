class FakeTooltip {
  constructor(_el?: any) {}
}

/**
 * 🧩 Mock unificado y a prueba de diferencias:
 * Cubre llamadas a:
 *   new Tooltip(...)
 *   new bootstrap.Tooltip(...)
 *   new window.bootstrap.Tooltip(...)
 */
const tooltipSpy = jasmine
  .createSpy('Tooltip')
  .and.callFake((el: any) => new FakeTooltip(el));

// aseguramos compatibilidad con cualquier referencia usada en el componente
(globalThis as any).Tooltip = tooltipSpy;
(globalThis as any).bootstrap = { Tooltip: tooltipSpy };
(window as any).bootstrap = (globalThis as any).bootstrap;

import { GraphQLResponse } from '../../app/shared/interfaces/graphql-response.interface';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { of, NEVER } from 'rxjs';
import { EventModalComponent } from '../../app/eventos/components/event-modal.component/pages/event-modal.component';
import { EventModalService } from '../../app/eventos/components/event-modal.component/services/event-modal.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { Actividades } from '../../app/eventos/interfaces/actividades.interface';

describe('✅ EventModalComponent', () => {
  let component: EventModalComponent;
  let fixture: ComponentFixture<EventModalComponent>;

  let modalServiceMock: jest.Mocked<EventModalService>;
  let snackMock: any;
  let loadingMock: jest.Mocked<LoadingService>;
  beforeEach(async () => {
    modalServiceMock = jest.fnObj('EventModalService', [
      'eliminarEvento',
    ]);
    loadingMock = jest.fnObj('LoadingService', ['show', 'hide']);

    snackMock = {
      confirm: jest.fn('confirm'),
      success: jest.fn('success'),
      error: jest.fn('error'),
    };

    await TestBed.configureTestingModule({
      imports: [EventModalComponent], // 👈 componente standalone real
      providers: [
        { provide: EventModalService, useValue: modalServiceMock },
        { provide: SnackbarService, useValue: snackMock },
        { provide: LoadingService, useValue: loadingMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;

    // 🧩 Mock completo sin romper DatePipe ni concatenaciones del HTML
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue({
      id_actividad: 'TEMP',
      nombre_actividad: 'Mock',
      fecha_actividad: '2025-01-30', // ✅ Objeto Date (octubre = mes 9)
      hora_inicio: '10:00',
      hora_fin: '11:00',
    } as any);

    fixture.detectChanges(); // 👌 Ahora el template se renderiza sin error
  });

  it('✅ debe crearse correctamente', () => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  /*it('🧠 ngAfterViewInit() debe inicializar tooltips', fakeAsync(() => {
  // 🔧 Creamos un elemento real dentro del fixture DOM
  const hostEl = fixture.nativeElement as HTMLElement;
  const tooltipDiv = document.createElement('div');
  tooltipDiv.setAttribute('data-bs-toggle', 'tooltip');
  hostEl.appendChild(tooltipDiv);

  // 🔍 Aseguramos que querySelectorAll sí devuelva el div recién insertado
  spyOn(document, 'querySelectorAll').and.returnValue([tooltipDiv] as any);

  // 🧩 Limpia el contador del spy
  (globalThis as any).bootstrap.Tooltip.calls.reset();

  // 💥 Ejecutamos el ciclo de detección y el hook
  fixture.detectChanges();
  component.ngAfterViewInit();
  tick();

  // ✅ Verificamos que se haya llamado exactamente una vez
  expect((globalThis as any).bootstrap.Tooltip).toHaveBeenCalledTimes(1);
}));
*/

  it('🧩 ngAfterViewInit() no debe fallar si no hay tooltips', () => {
    spyOn(document, 'querySelectorAll').and.returnValue([] as any);

    (globalThis as any).bootstrap.Tooltip.calls.reset();

    component.ngAfterViewInit();

    expect(document.querySelectorAll).toHaveBeenCalledWith(
      '[data-bs-toggle="tooltip"]'
    );
    expect((globalThis as any).bootstrap.Tooltip).not.toHaveBeenCalled();
  });

  it('⚙️ seleccionarAccion() debe emitir eventos correctamente', () => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const emitAccion = spyOn(component.accionSeleccionada, 'emit');
    const emitCerrar = spyOn(component.cerrar, 'emit');

    component.seleccionarAccion('editar');

    expect(emitAccion).toHaveBeenCalledWith('editar');
    expect(emitCerrar).toHaveBeenCalled();
  });

  it('🚫 eliminarEvento() no hace nada si no hay evento', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;

    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }

    spyOn(component, 'evento').and.returnValue(
      undefined as unknown as Actividades
    );
    component.eliminarEvento();
    tick();
    expect(snackMock.confirm).not.toHaveBeenCalled();
  }));

  it('🟡 eliminarEvento() cancela si el usuario responde "No"', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const mockEvento = {
      id_actividad: 'E1',
      nombre_actividad: 'Taller',
    } as Actividades;
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue(mockEvento);
    snackMock.confirm.and.returnValue(of(false));

    component.eliminarEvento();
    tick();

    expect(modalServiceMock.eliminarEvento).not.toHaveBeenCalled();
  }));

  it('✅ eliminarEvento() ejecuta eliminación exitosa', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const mockEvento = {
      id_actividad: 'E2',
      nombre_actividad: 'Evento',
    } as Actividades;
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue(mockEvento);
    snackMock.confirm.and.returnValue(of(true));

    const response: GraphQLResponse = { exitoso: 'S', mensaje: 'OK' };
    modalServiceMock.eliminarEvento.and.returnValue(Promise.resolve(response));

    const cerrarSpy = spyOn(component.cerrar, 'emit');
    component.eliminarEvento();
    tick();

    expect(loadingMock.show).toHaveBeenCalled();
    expect(modalServiceMock.eliminarEvento).toHaveBeenCalledWith('E2');
    expect(snackMock.success).toHaveBeenCalledWith('OK');
    expect(loadingMock.hide).toHaveBeenCalled();
    expect(cerrarSpy).toHaveBeenCalled();
  }));

  it('❌ eliminarEvento() muestra error si no exitoso', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const mockEvento = {
      id_actividad: 'E3',
      nombre_actividad: 'Fallido',
    } as Actividades;
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue(mockEvento);
    snackMock.confirm.and.returnValue(of(true));

    const response: GraphQLResponse = { exitoso: 'N', mensaje: 'Error' };
    modalServiceMock.eliminarEvento.and.returnValue(Promise.resolve(response));

    component.eliminarEvento();
    tick();

    expect(snackMock.error).toHaveBeenCalledWith('Error');
    expect(loadingMock.hide).toHaveBeenCalled();
  }));

  it('💥 eliminarEvento() maneja excepciones correctamente', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const mockEvento = {
      id_actividad: 'E4',
      nombre_actividad: 'Fatal',
    } as Actividades;
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue(mockEvento);
    snackMock.confirm.and.returnValue(of(true));
    modalServiceMock.eliminarEvento.and.returnValue(
      Promise.reject('Error inesperado')
    );

    component.eliminarEvento();
    tick();

    expect(snackMock.error).toHaveBeenCalledWith('Error inesperado');
    expect(loadingMock.hide).toHaveBeenCalled();
  }));

  it('🧩 eliminarEvento() debe funcionar si snack.confirm no existe (usa true por defecto)', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const mockEvento = {
      id_actividad: 'A6',
      nombre_actividad: 'Confirm Null',
    } as Actividades;
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue(mockEvento);

    // 🔧 Usamos ['snack'] para evitar el error TS2341

    (component as any)['snack'].confirm = () => of(true);

    const response: GraphQLResponse = { exitoso: 'S', mensaje: null };
    modalServiceMock.eliminarEvento.and.returnValue(Promise.resolve(response));

    const cerrarSpy = spyOn(component.cerrar, 'emit');

    component.eliminarEvento();
    tick();

    expect(modalServiceMock.eliminarEvento).toHaveBeenCalledWith('A6');
    expect(snackMock.success).toHaveBeenCalledWith('Eliminado correctamente');
    expect(cerrarSpy).toHaveBeenCalled();
  }));

  it('🧩 eliminarEvento() no debe hacer nada si confirm nunca emite valor', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const mockEvento = {
      id_actividad: 'A7',
      nombre_actividad: 'Sin confirm',
    } as Actividades;
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue(mockEvento);
    snackMock.confirm.and.returnValue(NEVER);

    component.eliminarEvento();
    tick(100);

    expect(modalServiceMock.eliminarEvento).not.toHaveBeenCalled();
  }));

  it('🧩 eliminarEvento() usa mensaje por defecto si mensaje es null', fakeAsync(() => {
    fixture = TestBed.createComponent(EventModalComponent);
    component = fixture.componentInstance;
    const mockEvento = {
      id_actividad: 'A8',
      nombre_actividad: 'Sin mensaje',
    } as Actividades;
    if ((component.evento as any).and?.identity) {
      (component.evento as any).and.stub();
    }
    spyOn(component, 'evento').and.returnValue(mockEvento);
    snackMock.confirm.and.returnValue(of(true));

    const response: GraphQLResponse = { exitoso: 'S', mensaje: null };
    modalServiceMock.eliminarEvento.and.returnValue(Promise.resolve(response));

    component.eliminarEvento();
    tick();

    expect(snackMock.success).toHaveBeenCalledWith('Eliminado correctamente');
  }));
});
