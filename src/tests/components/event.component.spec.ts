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
import CryptoJS from 'crypto-js';

// ✅ Servicios mockeados (Jest)
class EventServiceMock {
  obtenerConfiguracionEvento = jest.fn().mockReturnValue({
    subscribe: (cb: any) =>
      cb({
        id_programa: 'P1',
        sedes: [{ id_sede: '1', nombre: 'Principal' }],
        tiposDeActividad: [{ id_tipo_actividad: 'T1', nombre: 'General' }],
        aliados: [{ id_aliado: 'A1', nombre: 'Aliado 1' }],
        responsables: [{ id_responsable: 'R1', nombre: 'Resp 1' }],
        nombresDeActividad: [
          { nombre: 'Actividad 1', id_tipo_actividad: 'T1' },
        ],
        frecuencias: [{ id_frecuencia: 'F1', nombre: 'Semanalmente' }],
      }),
  });

  obtenerEventoPorId = jest.fn().mockResolvedValue({
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
  });

  crearEvento = jest.fn().mockResolvedValue({
    exitoso: 'S',
    mensaje: 'Evento creado correctamente',
  });
}

class GridSesionesServiceMock {
  guardarCambiosSesiones = jest
    .fn()
    .mockResolvedValue({ exitoso: 'S', mensaje: 'Sesiones guardadas' });
}

class AuthServiceMock {
  getUserUuid = jest.fn().mockReturnValue('USER-1');
}

class SnackbarServiceMock {
  success = jest.fn();
  error = jest.fn();
}

class LoadingServiceMock {
  show = jest.fn();
  hide = jest.fn();
}

describe('EventComponent (Angular 20) - Jest', () => {
  let component: EventComponent;
  let fixture: ComponentFixture<EventComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EventComponent, // ✅ standalone, Angular lo resuelve solo
        HttpClientTestingModule, // ✅ puedes dejar este porque es un provider test-only
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

  afterEach(() => jest.clearAllMocks());

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
    expect((component as any).eventService.crearEvento).toHaveBeenCalled();
  });

  it('🔁 debe actualizar sesiones correctamente', async () => {
    (component as any).cambiosSesionesSnapshot = {
      nuevos: [],
      modificados: [],
      eliminados: [],
    };
    await component.actualizarSesion();
    expect(
      (component as any).grid_sesionesService.guardarCambiosSesiones,
    ).toHaveBeenCalled();
  });

  it('🧠 debe ejecutar los efectos de signals sin errores', () => {
    expect(() => {
      const fn = (component as any).fechaPreseleccionada();
      expect(fn).toBeNull();
    }).not.toThrow();
  });

  //Adicionales
  // --- 🔹 ALIADOS & AUTOCOMPLETE ---
  it('🔎 debe filtrar aliados correctamente en onAliadoInput', () => {
    component.aliados = [
      { id_aliado: 'A1', nombre: 'Aliado Uno' } as any,
      { id_aliado: 'A2', nombre: 'Otro' } as any,
    ];
    const event = { target: { value: 'uno' } } as unknown as Event;
    component.onAliadoInput(event);
    expect(component.aliadosFiltrados.length).toBe(1);
    expect(component.mostrarSugerencias).toBe(true);
  });

  it('✅ debe seleccionar un aliado y asignar su id', () => {
    component.eventoForm.get('id_aliado')?.setValue('');
    const aliado = { id_aliado: 'A1', nombre: 'Aliado Uno' } as any;
    component.seleccionarAliado(aliado);
    expect(component.aliadoTexto).toBe('Aliado Uno');
    expect(component.eventoForm.get('id_aliado')?.value).toBe('A1');
    expect(component.mostrarSugerencias).toBe(false);
  });

  it('🚫 clickFuera debe ocultar sugerencias si hace clic fuera', () => {
    component.mostrarSugerencias = true;
    const evt = { target: document.createElement('div') } as any;
    component.clickFuera(evt);
    expect(component.mostrarSugerencias).toBe(false);
  });

  // --- 🔹 FILTROS Y VALIDACIONES ---
  it('🧮 debe filtrar eventos por tipo correctamente', () => {
    component.nombreDeEventos = [
      { nombre: 'Act 1', id_tipo_actividad: 'T1' },
      { nombre: 'Act 2', id_tipo_actividad: 'T2' },
    ] as any;
    (component as any).filtrarEventosPorTipo('T1');
    expect(component.nombresDeEventosFiltrados.length).toBe(1);
  });

  it('🔤 esListaNombreEvento debe detectar tipos específicos', () => {
    component.tiposDeActividad = [
      { id_tipo_actividad: 'T1', nombre: 'Contenido del ciclo' },
    ] as any;
    component.eventoForm.get('id_tipo_actividad')?.setValue('T1');
    expect(component.esListaNombreEvento()).toBe(true);
  });

  // --- 🔹 GUARDAR EVENTO ---
  it('❌ guardarEvento debe mostrar error si el formulario es inválido', () => {
    const spyError = jest.spyOn((component as any).snack, 'error');
    component.eventoForm.reset(); // inválido
    component.guardarEvento();
    expect(spyError).toHaveBeenCalledWith(
      'Formulario no válido. Todos los campos son obligatorios.',
    );
  });

  // --- 🔹 CARGAR EDICIÓN DESDE BACKEND ---
  it('📡 cargarEdicionDesdeBackend debe ejecutar correctamente', async () => {
    await component.cargarEdicionDesdeBackend('A1');
    expect(
      (component as any).eventService.obtenerEventoPorId,
    ).toHaveBeenCalledWith('A1');
    expect(component.eventoParaEditar?.id_actividad).toBe('A1');
  });

  it('🚨 cargarEdicionDesdeBackend debe manejar errores del backend', async () => {
    (component as any).eventService.obtenerEventoPorId.mockRejectedValueOnce(
      new Error('Error backend'),
    );
    const spyError = jest.spyOn((component as any).snack, 'error');
    await component.cargarEdicionDesdeBackend('BAD');
    expect(spyError).toHaveBeenCalledWith('No fue posible cargar el evento');
  });

  // --- 🔹 RESET FORM ---
  it('🧽 resetearFormulario debe limpiar y emitir eventos', () => {
    const spyEmit = jest.spyOn((component as any).cerrarFormulario, 'emit');
    component['resetearFormulario']();
    expect(spyEmit).toHaveBeenCalled();
    expect(component.eventoForm.enabled).toBe(true);
  });

  // --- 🔹 CAMBIOS DE SESIONES ---
  it('🔄 onCambiosSesiones debe actualizar snapshot', () => {
    const payload = { nuevos: [1], modificados: [2], eliminados: [3] } as any;
    component.onCambiosSesiones(payload);
    expect((component as any).cambiosSesionesSnapshot).toEqual(payload);
  });

  // --- 🔹 FUNCIONES AUXILIARES ---
  it('📅 getFinDeMes debe retornar el último día del mes', () => {
    const result = (component as any).getFinDeMes('2025-02-15');
    expect(result.getDate()).toBe(28);
  });

  it('🆕 crearSesion debe generar un id y usar el uuid', () => {
    const uuidSpy = jest
      .spyOn(global.crypto, 'randomUUID')
      .mockReturnValue(
        'fake-uuid' as `${string}-${string}-${string}-${string}-${string}`,
      );
    const base = { id_actividad: 'A1' } as any;
    const sesion = (component as any).crearSesion(
      '2025-10-06',
      '08:00',
      '10:00',
      base,
    );
    expect(sesion.id_sesion).toBe('fake-uuid');
    uuidSpy.mockRestore();
  });

  //adicionales 2:
  it('❌ crearEvento debe manejar respuesta fallida del backend', async () => {
    const mockService = (component as any).eventService;
    mockService.crearEvento.mockResolvedValueOnce({
      exitoso: 'N',
      mensaje: 'Error técnico',
    });

    const spyError = jest.spyOn((component as any).snack, 'error');
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

    await (component as any).crearEvento();
    expect(spyError).toHaveBeenCalledWith('Error técnico');
    expect((component as any).loadingService.hide).toHaveBeenCalled();
  });
  it('🔥 crearEvento debe capturar excepción y mostrar snackbar de error', async () => {
    const mockService = (component as any).eventService;
    mockService.crearEvento.mockRejectedValueOnce(new Error('Fallo grave'));
    const spyError = jest.spyOn((component as any).snack, 'error');

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

    await (component as any).crearEvento();
    expect(spyError).toHaveBeenCalledWith('Error inesperado al crear evento');
  });
  it('⚠️ actualizarSesion debe manejar respuesta fallida del backend', async () => {
    (
      component as any
    ).grid_sesionesService.guardarCambiosSesiones.mockResolvedValueOnce({
      exitoso: 'N',
      mensaje: 'Falló actualización',
    });
    const spyError = jest.spyOn((component as any).snack, 'error');
    await component.actualizarSesion();
    expect(spyError).toHaveBeenCalledWith('Falló actualización');
    expect((component as any).loadingService.hide).toHaveBeenCalled();
  });

  //adicionales 3
  it('⛔ guardarEvento: muestra error si el formulario es inválido', () => {
    const spyErr = jest.spyOn((component as any).snack, 'error');

    // Aseguramos que el form está inválido (dejarlo vacío)
    component.eventoForm.reset();

    component.guardarEvento();

    expect(spyErr).toHaveBeenCalledWith(
      'Formulario no válido. Todos los campos son obligatorios.',
    );
    expect((component as any).eventService.crearEvento).not.toHaveBeenCalled();
  });
  it('🗓️ crearEvento: genera sesiones para "A diario"', async () => {
    // Forzamos la frecuencia “A diario”
    component.frecuencias = [
      ...(component.frecuencias || []),
      { id_frecuencia: 'FD', nombre: 'A diario' } as any,
    ];

    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Actividad 1',
      descripcion: 'desc',
      // elegir un día a mitad de mes para evitar bordes
      fecha_actividad: '2025-05-10',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      id_frecuencia: 'FD',
    });

    await (component as any).crearEvento();

    const call = (component as any).eventService.crearEvento.mock.calls.at(-1);
    const sesionesArg = call[1] as any[];
    expect(sesionesArg.length).toBeGreaterThan(10); // debería crear bastantes días hábiles
  });

  it('📅 crearEvento: genera sesiones solo de lunes a viernes para "Todos los días de la semana"', async () => {
    component.frecuencias = [
      ...(component.frecuencias || []),
      { id_frecuencia: 'FWD', nombre: 'Todos los días de la semana' } as any,
    ];

    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: false,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Actividad 1',
      descripcion: 'desc',
      fecha_actividad: '2025-06-01', // inicio de mes
      hora_inicio: '08:00',
      hora_fin: '10:00',
      id_frecuencia: 'FWD',
    });

    await (component as any).crearEvento();

    const call = (component as any).eventService.crearEvento.mock.calls.at(-1);
    const sesionesArg = call[1] as any[];

    // Asegura que ningún día sea domingo (0) o sábado (6)
    const weekend = sesionesArg.some((s) => {
      const d = new Date(s.fecha_actividad + 'T00:00:00');
      return d.getDay() === 0 || d.getDay() === 6;
    });
    expect(weekend).toBe(false);
  });
  it('📆 crearEvento: genera sesiones mensuales (12) para "Mensualmente"', async () => {
    component.frecuencias = [
      ...(component.frecuencias || []),
      { id_frecuencia: 'FM', nombre: 'Mensualmente' } as any,
    ];

    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Actividad 1',
      descripcion: 'desc',
      // fecha complicada (fin de mes) para cubrir ajuste
      fecha_actividad: '2025-01-31',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      id_frecuencia: 'FM',
    });

    await (component as any).crearEvento();

    const call = (component as any).eventService.crearEvento.mock.calls.at(-1);
    const sesionesArg = call[1] as any[];
    expect(sesionesArg.length).toBe(12);
  });
  it('❌ crearEvento maneja respuesta fallida del backend', async () => {
    (component as any).eventService.crearEvento.mockResolvedValueOnce({
      exitoso: 'N',
      mensaje: 'Error técnico',
    });

    const spyErr = jest.spyOn((component as any).snack, 'error');

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

    await (component as any).crearEvento();
    expect(spyErr).toHaveBeenCalledWith('Error técnico');
    expect((component as any).loadingService.hide).toHaveBeenCalled();
  });
  it('🔥 crearEvento captura excepción y muestra snackbar de error', async () => {
    (component as any).eventService.crearEvento.mockRejectedValueOnce(
      new Error('Fallo grave'),
    );
    const spyErr = jest.spyOn((component as any).snack, 'error');

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

    await (component as any).crearEvento();
    expect(spyErr).toHaveBeenCalledWith('Error inesperado al crear evento');
  });
  it('⚠️ actualizarSesion maneja respuesta fallida del backend', async () => {
    (
      component as any
    ).grid_sesionesService.guardarCambiosSesiones.mockResolvedValueOnce({
      exitoso: 'N',
      mensaje: 'Falló actualización',
    });
    const spyErr = jest.spyOn((component as any).snack, 'error');

    await component.actualizarSesion();

    expect(spyErr).toHaveBeenCalledWith('Falló actualización');
    expect((component as any).loadingService.hide).toHaveBeenCalled();
  });
  it('🧪 esListaNombreEvento devuelve true para "Actividad General" y false en otros casos', () => {
    // Caso false: sin tipo seleccionado
    component.eventoForm.get('id_tipo_actividad')?.setValue(null);
    expect(component.esListaNombreEvento()).toBe(false);

    // Caso false: tipo inexistente
    component.eventoForm.get('id_tipo_actividad')?.setValue('Z');
    component.tiposDeActividad = [
      { id_tipo_actividad: 'X', nombre: 'Otro' } as any,
    ];
    expect(component.esListaNombreEvento()).toBe(false);

    // Caso true: nombre que coincide
    component.tiposDeActividad = [
      { id_tipo_actividad: 'TG', nombre: 'Actividad General' } as any,
    ];
    component.eventoForm.get('id_tipo_actividad')?.setValue('TG');
    expect(component.esListaNombreEvento()).toBe(true);
  });
  it('✏️ onAccionSeleccionado("editar") precarga y emite limpiar', () => {
    const spyPre = jest.spyOn(component, 'precargarFormulario' as any);
    const spyEmit = jest.spyOn(component.limpiarEventoSeleccionado, 'emit');

    (component as any).eventoSeleccionado = () => ({
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'X',
      descripcion: 'Y',
      fecha_actividad: '2025-01-01',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      id_frecuencia: 'F1',
      sesiones: [],
    });

    component.onAccionSeleccionado('editar');

    expect(spyPre).toHaveBeenCalled();
    expect(spyEmit).toHaveBeenCalled();
  });

  it('📝 onAccionSeleccionado("asistencia") solo limpia selección', () => {
    const spyEmit = jest.spyOn(component.limpiarEventoSeleccionado, 'emit');
    component.onAccionSeleccionado('asistencia');
    expect(spyEmit).toHaveBeenCalled();
  });



  it('🚫 cargarEdicionDesdeBackend maneja error y muestra snackbar', async () => {
    (component as any).eventService.obtenerEventoPorId.mockRejectedValueOnce(
      new Error('X'),
    );
    const spyErr = jest.spyOn((component as any).snack, 'error');

    (component as any).cargarEdicionDesdeBackend('BAD');
    await new Promise((r) => setTimeout(r, 0));

    expect(spyErr).toHaveBeenCalledWith('No fue posible cargar el evento');
  });
});
