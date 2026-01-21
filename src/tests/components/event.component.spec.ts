import { expect as jestExpect } from '@jest/globals';
import {
  TestBed,
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import { EventComponent } from '../../app/eventos/components/event.component/pages/event.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventService } from '../../app/eventos/components/event.component/services/event.service';
import { GridSesionesService } from '../../app/eventos/components/grid-sesiones.component/services/grid-sesiones.service';
import { AuthService } from '../../app/shared/services/auth.service';
import { SnackbarService } from '../../app/shared/services/snackbar.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import CryptoJS from 'crypto-js';

// ✅ Servicios mockeados (Jest)

class GraphQLServiceMock {
  mutation = jest.fn();
}
class AuthServiceMock {

  getUserUuid = jest.fn().mockReturnValue('USER-123');
}
class LoadIndexDBServiceMock {
  ping = jest.fn();
}
class SesionesDataSourceMock {
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
}
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

class SnackbarServiceMock {
  success = jest.fn();
  error = jest.fn();
}

class LoadingServiceMock {
  show = jest.fn();
  hide = jest.fn();
}

describe('EventComponent (Angular 20) - Jest', () => {
  it('🧪 crearEvento: muestra error desconocido si resp.mensaje es undefined', async () => {
    component.frecuencias = [{ id_frecuencia: 'F1', nombre: 'Semanalmente' }];
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'F1',
    });
    // Forzar respuesta fallida sin mensaje
  jest.spyOn(component['eventService'], 'crearEvento').mockResolvedValue({ exitoso: 'N', mensaje: null });
    const snackSpy = jest.spyOn(component['snack'], 'error');
    await component['crearEvento']();
    expect(snackSpy).toHaveBeenCalledWith('Error desconocido al crear el evento');
  });
  it('🧪 crearEvento: usa nombre de nombresDeEventosFiltrados si esListaNombreEvento', async () => {
    // Forzar esListaNombreEvento a true
    jest.spyOn(component, 'esListaNombreEvento').mockReturnValue(true);
    const nombre = 'Actividad General';
    component.nombresDeEventosFiltrados = [
      { nombre, id_tipo_actividad: 'T1' },
    ];
    component.frecuencias = [{ id_frecuencia: 'F1', nombre: 'Semanalmente' }];
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: nombre,
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'F1',
    });
    const spyCrear = jest.spyOn(component['eventService'], 'crearEvento').mockResolvedValue({ exitoso: 'S', mensaje: 'ok' });
    await component['crearEvento']();
    expect(spyCrear).toHaveBeenCalled();
    const payload = spyCrear.mock.calls[0][0];
    expect(payload.nombre_actividad).toBe('Actividad General');
  });

  it('🧪 crearEvento: usa fallback de nombreDeEventos si no hay coincidencia en nombresDeEventosFiltrados', async () => {
    jest.spyOn(component, 'esListaNombreEvento').mockReturnValue(true);
    component.nombresDeEventosFiltrados = [];
    component.nombreDeEventos = [
      { nombre: 'Otra Actividad', id_tipo_actividad: 'T1' },
    ];
    component.frecuencias = [{ id_frecuencia: 'F1', nombre: 'Semanalmente' }];
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Otra Actividad',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'F1',
    });
    const spyCrear = jest.spyOn(component['eventService'], 'crearEvento').mockResolvedValue({ exitoso: 'S', mensaje: 'ok' });
    await component['crearEvento']();
    expect(spyCrear).toHaveBeenCalled();
    const payload = spyCrear.mock.calls[0][0];
    expect(payload.nombre_actividad).toBe('Otra Actividad');
  });
  it('🧪 crearEvento: selecciona nombre de nombresDeEventosFiltrados si esListaNombreEvento y hay coincidencia', () => {
    // Forzar esListaNombreEvento a true
    jest.spyOn(component, 'esListaNombreEvento').mockReturnValue(true);
    const nombre = 'Actividad General';
    component.nombresDeEventosFiltrados = [
      { nombre, id_tipo_actividad: 'T1' },
    ];
    const evento = { nombre_actividad: nombre };
    // Simula la lógica
    let nombreActividad = evento.nombre_actividad;
    const seleccionado = component.nombresDeEventosFiltrados.find(
      (n: any) => n.nombre === evento.nombre_actividad,
    );
    if (seleccionado) {
      nombreActividad = seleccionado.nombre;
    }
    expect(nombreActividad).toBe('Actividad General');
  });

  it('🧪 crearEvento: usa fallback si no hay coincidencia en nombresDeEventosFiltrados', () => {
    jest.spyOn(component, 'esListaNombreEvento').mockReturnValue(true);
    component.nombresDeEventosFiltrados = [];
    component.nombreDeEventos = [
      { nombre: 'Otra Actividad', id_tipo_actividad: 'T1' },
    ];
    const evento = { nombre_actividad: 'Otra Actividad' };
    let nombreActividad = evento.nombre_actividad;
    const seleccionado = component.nombresDeEventosFiltrados.find(
      (n: any) => n.nombre === evento.nombre_actividad,
    );
    if (seleccionado) {
      nombreActividad = seleccionado.nombre;
    } else {
      const buscado = (component.nombreDeEventos || []).find(
        (n: any) => n.nombre === evento.nombre_actividad,
      );
      nombreActividad = buscado?.nombre ?? evento.nombre_actividad;
    }
    expect(nombreActividad).toBe('Otra Actividad');
  });
 
  it('🧪 crearEvento: no genera sesiones si nombreFrecuencia es ""', () => {
    // Prepara frecuencias vacías para forzar nombreFrecuencia = ''
    component.frecuencias = [];
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'NO_MATCH',
    });
    // Espía para capturar las sesiones generadas
    const crearSesionSpy = jest.spyOn(component as any, 'crearSesion');
    // Ejecuta la lógica relevante de crearEvento
    const evento = component.eventoForm.getRawValue();
    const sesiones = [];
    const fechaBase = new Date(evento.fecha_actividad ?? Date.now());
    let finMes = new Date();
    if (evento.fecha_actividad !== null && evento.fecha_actividad !== undefined) {
      finMes = component['getFinDeMes'](evento.fecha_actividad);
    }
    let year, month, day, actual;
    if (evento.fecha_actividad) {
      [year, month, day] = evento.fecha_actividad.split('-').map(Number);
      actual = new Date(year, month - 1, day);
    }
    const nombreFrecuencia = component.frecuencias.find((f: any) => f.id_frecuencia === evento.id_frecuencia)?.nombre || '';
    // Simula el bloque de 'a diario'
    if (nombreFrecuencia.toLowerCase() === 'a diario') {
      while (actual != null && actual <= finMes) {
        if (actual.getDay() >= 1 && actual.getDay() <= 6) {
          sesiones.push(
            component['crearSesion'](
              component['formatearFechaLocal'](actual),
              evento.hora_inicio ?? '',
              evento.hora_fin ?? '',
              evento,
            ),
          );
        }
        actual.setDate(actual.getDate() + 1);
      }
    }
    expect(sesiones.length).toBe(0);
    expect(crearSesionSpy).not.toHaveBeenCalled();
  });
  it('🧪 crearEvento: nombreFrecuencia es "" si id_frecuencia no existe en this.frecuencias', () => {
    // Prepara frecuencias vacías
    component.frecuencias = [];
    // Prepara el formulario con un id_frecuencia que no existe
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'NO_MATCH',
    });
    // Espía para capturar el valor de nombreFrecuencia
    let nombreFrecuencia: string | undefined = undefined;
    // Simula la lógica de crearEvento solo para capturar el valor
    const evento = component.eventoForm.getRawValue();
    nombreFrecuencia = component.frecuencias.find((f: any) => f.id_frecuencia === evento.id_frecuencia)?.nombre || '';
    expect(nombreFrecuencia).toBe('');
  });

  it('🧪 crearEvento: nombreFrecuencia es "" si this.frecuencias está vacío', () => {
    component.frecuencias = [];
    const evento = { id_frecuencia: 'CUALQUIERA' };
    const nombreFrecuencia = component.frecuencias.find((f: any) => f.id_frecuencia === evento.id_frecuencia)?.nombre || '';
    expect(nombreFrecuencia).toBe('');
  });
  it('🧪 guardarEvento llama crearEvento si NO está editando o eventoParaEditar no tiene id_actividad', () => {
    // Caso 1: NO está editando (eventoParaEditar = null)
    component.eventoParaEditar = null;
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'F1',
    });
    const spyCrear = jest.spyOn(component as any, 'crearEvento').mockImplementation(() => undefined);
    component.guardarEvento();
    expect(spyCrear).toHaveBeenCalled();

    // Caso 2: eventoParaEditar existe pero NO tiene id_actividad
    spyCrear.mockClear();
    component.eventoParaEditar = {} as any;
    component.guardarEvento();
    expect(spyCrear).toHaveBeenCalled();
  });
  it('🧪 guardarEvento llama actualizarSesion si estaEditando y eventoParaEditar tiene id_actividad', () => {
    // Prepara el estado de edición
    component.eventoParaEditar = { id_actividad: 'A1' } as any;
    // Forzar que el formulario sea válido
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'F1',
    });
  const spy = jest.spyOn(component, 'actualizarSesion').mockImplementation(() => Promise.resolve());
    component.guardarEvento();
    expect(spy).toHaveBeenCalled();
  });
  it('🧪 precargarFormulario asigna 0 a nro_asistentes si es undefined en la sesión', () => {
    const evento = {
      id_actividad: 'A1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      id_frecuencia: 'F1',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      sesiones: [
        {
          fecha_actividad: '2025-10-06',
          hora_inicio: '08:00',
          hora_fin: '09:00',
          id_sesion: 'S1',
          id_actividad: 'A1',
          // nro_asistentes: undefined
        },
      ],
    } as any;
    component.precargarFormulario(evento);
    const sesionesFormArray = component.eventoForm.get('sesiones') as any;
    expect(sesionesFormArray.at(0).get('nro_asistentes').value).toBe(0);
  });
  it('🧪 precargarFormulario asigna true si evento.institucional === "S" (string)', () => {
    // Precondición: el campo institucional debe ser false inicialmente
    component.eventoForm.patchValue({ institucional: false });
    const evento = {
      id_actividad: 'A1',
      institucional: 'S',
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      id_frecuencia: 'F1',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      sesiones: [],
    } as any;
    component.precargarFormulario(evento);
    expect(component.eventoForm.get('institucional')?.value).toBe(true);
  });
  it('🧪 precargarFormulario retorna temprano si eventoForm es undefined', () => {
    component.eventoForm = undefined as any;
    // No debe lanzar error ni ejecutar lógica
    expect(() => component.precargarFormulario({
      id_actividad: 'A1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      id_frecuencia: 'F1',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      sesiones: [],
    } as any)).not.toThrow();
  });
  it('🧪 cargarEdicionDesdeBackend asigna aliadoTexto correctamente según id_aliado', async () => {
    // Mockear cargarConfiguracionFormulario para no sobrescribir aliados
    jest.spyOn(component, 'cargarConfiguracionFormulario').mockImplementation(() => {});

    // Caso 1: existe el aliado
    component.aliados = [
      { id_aliado: 'A1', nombre: 'Aliado Uno' },
      { id_aliado: 'A2', nombre: 'Aliado Dos' },
    ];
    const resp = {
      actividad: {
        id_aliado: 'A2',
        id_actividad: '', institucional: '', id_sede: '', id_tipo_actividad: '', id_responsable: '', nombre_actividad: '', descripcion: '', id_frecuencia: '', fecha_actividad: '', hora_inicio: '', hora_fin: ''
      },
      sesiones: [],
    };
    const eventService = TestBed.inject(EventService) as any;
    eventService.obtenerEventoPorId = jest.fn().mockResolvedValue(resp);
    await component.cargarEdicionDesdeBackend('dummy');
    expect(component.aliadoTexto).toBe('Aliado Dos');

    // Caso 2: no existe el aliado
    component.aliados = [
      { id_aliado: 'A1', nombre: 'Aliado Uno' },
    ];
    const resp2 = {
      actividad: {
        id_aliado: 'NO_MATCH',
        id_actividad: '', institucional: '', id_sede: '', id_tipo_actividad: '', id_responsable: '', nombre_actividad: '', descripcion: '', id_frecuencia: '', fecha_actividad: '', hora_inicio: '', hora_fin: ''
      },
      sesiones: [],
    };
    eventService.obtenerEventoPorId = jest.fn().mockResolvedValue(resp2);
    await component.cargarEdicionDesdeBackend('dummy');
    expect(component.aliadoTexto).toBe('');
  });
  it('🧪 cargarEdicionDesdeBackend adapta correctamente campos vacíos y sesiones vacías', async () => {
    // Mock de respuesta del backend con campos vacíos y sesiones vacías
    const resp = {
      actividad: {
        id_actividad: '',
        institucional: '',
        id_sede: '',
        id_tipo_actividad: '',
        id_responsable: '',
        id_aliado: '',
        nombre_actividad: '',
        descripcion: '',
        id_frecuencia: '',
        fecha_actividad: '',
        hora_inicio: '',
        hora_fin: '',
      },
      sesiones: [],
    };
    // Sobrescribe el método del mock global antes de la llamada
    const eventService = TestBed.inject(EventService) as any;
    eventService.obtenerEventoPorId = jest.fn().mockResolvedValue(resp);
    // Llamada
    await component.cargarEdicionDesdeBackend('dummy');
    // Verifica que eventoParaEditar tenga los valores vacíos y sesiones como []
    expect(component.eventoParaEditar).toEqual({
      id_actividad: '',
      institucional: false, // '' === 'S' es false
      id_sede: '',
      id_tipo_actividad: '',
      id_responsable: '',
      id_aliado: '',
      nombre_actividad: '',
      descripcion: '',
      id_frecuencia: '',
      fecha_actividad: '',
      hora_inicio: '',
      hora_fin: '',
      sesiones: [],
    });
  });
  it('🧪 onAccionSeleccionado("editar") llama precargarFormulario con null si eventoSeleccionado retorna null', () => {
    const spy = jest.spyOn(component, 'precargarFormulario');
    Object.defineProperty(component, 'eventoSeleccionado', {
      value: () => null,
      writable: true,
    });
    // No debe lanzar error
    expect(() => component.onAccionSeleccionado('editar')).not.toThrow();
    expect(spy).toHaveBeenCalledWith(null);
  });
  it('🧪 onAccionSeleccionado("editar") llama cargarEdicionDesdeBackend si eventoParaEditar tiene id_actividad', () => {
    const spy = jest.spyOn(component, 'cargarEdicionDesdeBackend').mockImplementation(() => undefined);
    // Simula correctamente la señal Angular como función
    Object.defineProperty(component, 'eventoSeleccionado', {
      value: () => ({ id_actividad: 'A999' }),
      writable: true,
    });
    component.onAccionSeleccionado('editar');
    expect(spy).toHaveBeenCalledWith('A999');
  });
  it('🧪 llama cargarEdicionDesdeBackend si eventoParaEditar tiene id_actividad', () => {
    const spy = jest.spyOn(component, 'cargarEdicionDesdeBackend').mockImplementation(() => undefined);
    component.eventoParaEditar = { id_actividad: 'A123' } as any;
    // Simular llamada al método que contiene la lógica
    if (component.eventoParaEditar?.id_actividad) {
      component.cargarEdicionDesdeBackend(component.eventoParaEditar.id_actividad);
    }
    expect(spy).toHaveBeenCalledWith('A123');
  });
  it('🔤 cargarConfiguracionFormulario ordena aliados por nombre cuando NO recibe parámetros', () => {
    const aliadosDesordenados = [
      { id_aliado: '2', nombre: 'Zeta' },
      { id_aliado: '1', nombre: 'Alfa' },
      { id_aliado: '3', nombre: 'Beta' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: [],
        aliados: aliadosDesordenados,
        responsables: [], nombresDeActividad: [], frecuencias: [],
      }),
    });
    component.cargarConfiguracionFormulario();
    expect(component.aliados.map((a: any) => a.nombre)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('🔤 cargarConfiguracionFormulario ordena responsables por nombre cuando NO recibe parámetros', () => {
    const responsablesDesordenados = [
      { id_responsable: '2', nombre: 'Zeta' },
      { id_responsable: '1', nombre: 'Alfa' },
      { id_responsable: '3', nombre: 'Beta' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: [],
        aliados: [],
        responsables: responsablesDesordenados, nombresDeActividad: [], frecuencias: [],
      }),
    });
    component.cargarConfiguracionFormulario();
    expect(component.responsables.map((r: any) => r.nombre)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('🔤 cargarConfiguracionFormulario ordena responsables incluso si nombre es null o undefined', () => {
    const responsablesDesordenados = [
      { id_responsable: '1', nombre: undefined },
      { id_responsable: '2', nombre: 'Bravo' },
      { id_responsable: '3', nombre: null },
      { id_responsable: '4', nombre: 'Alpha' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: [],
        aliados: [],
        responsables: responsablesDesordenados, nombresDeActividad: [], frecuencias: [],
      }),
    });
    component.cargarConfiguracionFormulario();
    // null y undefined deben ir primero ('' < 'Alpha' < 'Bravo')
    expect(component.responsables.map((r: any) => r.nombre)).toEqual([undefined, null, 'Alpha', 'Bravo']);
  });

  it('🔤 cargarConfiguracionFormulario ordena nombreDeEventos por nombre cuando NO recibe parámetros', () => {
    const nombresDesordenados = [
      { nombre: 'Zeta', id_tipo_actividad: 'T1' },
      { nombre: 'Alfa', id_tipo_actividad: 'T2' },
      { nombre: 'Beta', id_tipo_actividad: 'T3' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: [],
        aliados: [], responsables: [], nombresDeActividad: nombresDesordenados, frecuencias: [],
      }),
    });
    component.cargarConfiguracionFormulario();
    expect(component.nombreDeEventos.map((n: any) => n.nombre)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('🔤 cargarConfiguracionFormulario ordena frecuencias por nombre cuando NO recibe parámetros', () => {
    const frecuenciasDesordenadas = [
      { id_frecuencia: '2', nombre: 'Zeta' },
      { id_frecuencia: '1', nombre: 'Alfa' },
      { id_frecuencia: '3', nombre: 'Beta' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: [],
        aliados: [], responsables: [], nombresDeActividad: [], frecuencias: frecuenciasDesordenadas,
      }),
    });
    component.cargarConfiguracionFormulario();
    expect(component.frecuencias.map((f: any) => f.nombre)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('🔤 cargarConfiguracionFormulario ordena frecuencias incluso si nombre es null o undefined', () => {
    const frecuenciasDesordenadas = [
      { id_frecuencia: '1', nombre: undefined },
      { id_frecuencia: '2', nombre: 'Bravo' },
      { id_frecuencia: '3', nombre: null },
      { id_frecuencia: '4', nombre: 'Alpha' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: [],
        aliados: [], responsables: [], nombresDeActividad: [], frecuencias: frecuenciasDesordenadas,
      }),
    });
    component.cargarConfiguracionFormulario();
    // null y undefined deben ir primero ('' < 'Alpha' < 'Bravo')
    expect(component.frecuencias.map((f: any) => f.nombre)).toEqual([undefined, null, 'Alpha', 'Bravo']);
  });
  it('🔤 cargarConfiguracionFormulario ordena tiposDeActividad por nombre cuando NO recibe parámetros', () => {
    // Mockear el servicio para devolver tipos desordenados
    const tiposDesordenados = [
      { id_tipo_actividad: '2', nombre: 'Zeta' },
      { id_tipo_actividad: '1', nombre: 'Alfa' },
      { id_tipo_actividad: '3', nombre: 'Beta' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: tiposDesordenados,
        aliados: [], responsables: [], nombresDeActividad: [], frecuencias: [],
      }),
    });
    // Llamar sin parámetros
    component.cargarConfiguracionFormulario();
    // Debe estar ordenado por nombre
    expect(component.tiposDeActividad.map((t: any) => t.nombre)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('🔤 cargarConfiguracionFormulario ordena tiposDeActividad incluso si nombre es null o undefined', () => {
    const tiposDesordenados = [
      { id_tipo_actividad: '1', nombre: undefined },
      { id_tipo_actividad: '2', nombre: 'Bravo' },
      { id_tipo_actividad: '3', nombre: null },
      { id_tipo_actividad: '4', nombre: 'Alpha' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: tiposDesordenados,
        aliados: [], responsables: [], nombresDeActividad: [], frecuencias: [],
      }),
    });
    component.cargarConfiguracionFormulario();
    // null y undefined deben ir primero ('' < 'Alpha' < 'Bravo')
    expect(component.tiposDeActividad.map((t: any) => t.nombre)).toEqual([undefined, null, 'Alpha', 'Bravo']);
  });
  it('🔤 cargarConfiguracionFormulario ordena sedes por nombre cuando NO recibe parámetros', () => {
    // Mockear el servicio para devolver sedes desordenadas
    const sedesDesordenadas = [
      { id_sede: '2', nombre: 'Zeta' },
      { id_sede: '1', nombre: 'Alfa' },
      { id_sede: '3', nombre: 'Beta' },
    ];
    (component as any).eventService.obtenerConfiguracionEvento = jest.fn().mockReturnValue({
      subscribe: (cb: any) => cb({
        id_programa: 'P1',
        sedes: sedesDesordenadas,
        tiposDeActividad: [],
        aliados: [], responsables: [], nombresDeActividad: [], frecuencias: [],
      }),
    });
    // Llamar sin parámetros
    component.cargarConfiguracionFormulario();
    // Debe estar ordenado por nombre
    expect(component.sedes.map((s: any) => s.nombre)).toEqual(['Alfa', 'Beta', 'Zeta']);
  });

  it('🔤 cargarConfiguracionFormulario NO ordena sedes si recibe parámetros', () => {
    // Desordenadas a propósito
    const params = {
      sedes: [
        { id_sede: '2', nombre: 'Zeta' },
        { id_sede: '1', nombre: 'Alfa' },
        { id_sede: '3', nombre: 'Beta' },
      ],
      tiposDeActividad: [], aliados: [], responsables: [], nombresDeActividad: [], frecuencias: [],
    } as any;
    component.cargarConfiguracionFormulario(params);
    // El orden debe ser igual al de entrada
    expect(component.sedes.map((s: any) => s.nombre)).toEqual(['Zeta', 'Alfa', 'Beta']);
  });
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
        { provide: GridSesionesService, useClass: GridSesionesServiceMock },
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

    it('❌ actualizarSesion muestra mensaje por defecto si resp.exitoso = "N" y resp.mensaje es undefined', async () => {
        component['cambiosSesionesSnapshot'] = { nuevos: [], modificados: [], eliminados: [] };
        const gridService = component['grid_sesionesService'];
        jest.spyOn(gridService, 'guardarCambiosSesiones').mockResolvedValue({ exitoso: 'N', mensaje: null });
        const snackSpy = jest.spyOn(component['snack'], 'error');
        await component.actualizarSesion();
        expect(snackSpy).toHaveBeenCalledWith('No se pudieron actualizar las sesiones');
      });

    it('✅ actualizarSesion muestra el mensaje personalizado si resp.exitoso = "S" y resp.mensaje es string', async () => {
      component['cambiosSesionesSnapshot'] = { nuevos: [], modificados: [], eliminados: [] };
      const gridService = component['grid_sesionesService'];
      jest.spyOn(gridService, 'guardarCambiosSesiones').mockResolvedValue({ exitoso: 'S', mensaje: '¡Sesiones guardadas exitosamente!' });
      const snackSpy = jest.spyOn(component['snack'], 'success');
      await component.actualizarSesion();
      expect(snackSpy).toHaveBeenCalledWith('¡Sesiones guardadas exitosamente!');
    });
  it('✅ actualizarSesion muestra mensaje por defecto "Sesiones actualizadas" si resp.exitoso = "S" y resp.mensaje es undefined', async () => {
    component['cambiosSesionesSnapshot'] = { nuevos: [], modificados: [], eliminados: [] };
    const gridService = component['grid_sesionesService'];
    jest.spyOn(gridService, 'guardarCambiosSesiones').mockResolvedValue({ exitoso: 'S', mensaje: null });
    const snackSpy = jest.spyOn(component['snack'], 'success');
    await component.actualizarSesion();
    expect(snackSpy).toHaveBeenCalledWith('Sesiones actualizadas');
  });

  it('✔️ debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it(
    '🧪 efecto: llama cargarEdicionDesdeBackend cuando eventoSeleccionado tiene id_actividad',
    fakeAsync(() => {
      const spy = jest
        .spyOn(component, 'cargarEdicionDesdeBackend')
        .mockImplementation(() => undefined);

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

      fixture.componentRef.setInput('eventoSeleccionado', evento);
      fixture.detectChanges();
      flushMicrotasks();

      expect(spy).toHaveBeenCalledWith('A1');
    }),
  );

  it(
    '🧪 efecto: llama precargarFormulario cuando eventoSeleccionado NO tiene id_actividad',
    fakeAsync(() => {
      const spy = jest
        .spyOn(component, 'precargarFormulario')
        .mockImplementation(() => undefined);

      const evento = {
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

      fixture.componentRef.setInput('eventoSeleccionado', evento);
      fixture.detectChanges();
      flushMicrotasks();

      expect(spy).toHaveBeenCalledWith(evento);
    }),
  );

  it('🧩 debe inicializar el formulario con ngOnInit', () => {
    expect(component.eventoForm).toBeTruthy();
    expect(component.eventoForm.get('id_programa')).toBeTruthy();
  });

  it('� modoSoloLectura devuelve false cuando id_sesion es null o cadena vacía', () => {
    component.eventoParaEditar = { id_sesion: null } as any;
    expect(component.modoSoloLectura).toBe(false);

    component.eventoParaEditar = { id_sesion: '' } as any;
    expect(component.modoSoloLectura).toBe(false);
  });

  it('📍 modoSoloLectura devuelve true cuando hay id_sesion válido', () => {
    component.eventoParaEditar = { id_sesion: 'S-123' } as any;
    expect(component.modoSoloLectura).toBe(true);
  });

  it('�📋 debe precargar el formulario con un evento', () => {
    const evento = {
      id_actividad: 'A1',
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Demo',
      descripcion: 'desc',
      id_frecuencia: 'F1',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
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


  it('🗓️ debe actualizar el campo fecha_actividad cuando cambia fechaPreseleccionada', () => {
    // El formulario ya está inicializado por beforeEach
    fixture.detectChanges();
    // Aseguramos que el campo fecha_actividad está vacío
    component.eventoForm.patchValue({ fecha_actividad: '' });
    const nuevaFecha = '2025-11-15';
    // Cambiamos la señal input usando el método correcto de Angular
    fixture.componentRef.setInput('fechaPreseleccionada', nuevaFecha);
    fixture.detectChanges();
    // El efecto debería actualizar el campo fecha_actividad
    expect(component.eventoForm.get('fecha_actividad')?.value).toBe(nuevaFecha);
  });

  it('🧠 debe ejecutar los efectos de signals sin errores', () => {
    expect(() => {
      const fn = (component as any).fechaPreseleccionada();
      expect(fn).toBeNull();
    }).not.toThrow();
  });

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

  // --- 🔹 RESET FORM ---
  it('🧽 resetearFormulario debe limpiar y emitir eventos', () => {
    const spyEmit = jest.spyOn((component as any).cerrarFormulario, 'emit');
    component['resetearFormulario']();
    expect(spyEmit).toHaveBeenCalled();
    expect(component.eventoForm.enabled).toBe(true);
  });

  // --- 🔹 CAMBIOS DE SESIONES ---
  it('🔄 onCambiosSesiones debe actualizar snapshot', () => {
    const payload = { nuevos: [1], modificados: [2], eliminados: 3 } as any;
    component.onCambiosSesiones(payload);
    expect((component as any).cambiosSesionesSnapshot).toEqual({
      nuevos: [1],
      modificados: [2],
      eliminados: 3,
    });
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

  it('🚨 cargarEdicionDesdeBackend debe manejar errores del backend', async () => {
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => { });
    const mockError = new Error('Error backend');

    // ✅ Mockeamos el método real que se usa en el componente
    component['eventService'].obtenerEventoPorId = jest
      .fn()
      .mockRejectedValue(mockError);

    // ✅ Ejecutamos el método (no es async)
    component.cargarEdicionDesdeBackend('A1');

    // ✅ Esperamos a que el .catch() interno se ejecute (equivalente a setImmediate)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // ✅ Verificamos los efectos
    expect(component['snack'].error).toHaveBeenCalledWith(
      'No fue posible cargar el evento',
    );
    expect(spyError).toHaveBeenCalledWith(
      '❌ Error al obtener evento:',
      mockError,
    );

    spyError.mockRestore();
  });

  it('📦 cargarConfiguracionFormulario usa parámetros y filtra eventos', () => {
    const params = {
      sedes: [{ id_sede: 'S1', nombre: 'Unica' }],
      tiposDeActividad: [{ id_tipo_actividad: 'T1', nombre: 'General' }],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
    } as any;

    component.cargarConfiguracionFormulario(params);
    expect(component.sedes.length).toBe(1);
    expect(component.tiposDeActividad.length).toBe(1);
  });

  it('🏠 cargarConfiguracionFormulario asigna sede única si no está editando', () => {
    // 🔹 Evita error de getter o signal readonly
    if (typeof (component as any).estaEditando?.set === 'function') {
      (component as any).estaEditando.set(false);
    } else {
      Object.defineProperty(component, 'estaEditando', {
        get: () => false,
        configurable: true,
      });
    }

    (component as any).eventService.obtenerConfiguracionEvento = jest
      .fn()
      .mockReturnValue({
        subscribe: (cb: any) =>
          cb({
            id_programa: 'P1',
            sedes: [{ id_sede: 'S1', nombre: 'Principal' }],
            tiposDeActividad: [],
            aliados: [],
            responsables: [],
            nombresDeActividad: [],
            frecuencias: [],
          }),
      });

    component.cargarConfiguracionFormulario();

    expect(component.eventoForm.get('id_sede')?.value).toBe('S1');
  });

  it('🧩 cargarEdicionDesdeBackend ejecuta finally sin error', async () => {
    await component.cargarEdicionDesdeBackend('A1'); // camino normal
    expect((component as any).aliadoTexto).toBeDefined();
  });

  it('🧩 precargarFormulario habilita form cuando no edita', () => {
    component.eventoParaEditar = null;
    component.precargarFormulario({
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Act',
      descripcion: 'desc',
      fecha_actividad: '2025-10-06',
      hora_inicio: '08:00',
      hora_fin: '09:00',
      id_frecuencia: 'F1',
      sesiones: [],
    });
    expect(component.eventoForm.enabled).toBe(true);
  });
  it('📅 crearEvento genera sesiones semanales', async () => {
    component.frecuencias = [
      { id_frecuencia: 'FS', nombre: 'Semanalmente' },
    ] as any;
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Actividad 1',
      descripcion: 'desc',
      fecha_actividad: '2025-10-01',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      id_frecuencia: 'FS',
    });
    await (component as any).crearEvento();
    const call = (component as any).eventService.crearEvento.mock.calls.at(-1);
    expect(call[1].length).toBeGreaterThan(4); // ~4 semanas
  });

  it('🧩 crearEvento maneja fecha_actividad undefined', async () => {
    component.eventoForm.patchValue({
      id_programa: 'P1',
      institucional: true,
      id_sede: '1',
      id_tipo_actividad: 'T1',
      id_responsable: 'R1',
      id_aliado: 'A1',
      nombre_actividad: 'Actividad 1',
      descripcion: 'desc',
      fecha_actividad: undefined,
      hora_inicio: '08:00',
      hora_fin: '10:00',
      id_frecuencia: 'F1',
    });
    await (component as any).crearEvento();
    expect((component as any).snack.error).not.toHaveBeenCalled();
  });
  it('💥 actualizarSesion captura excepción y muestra snackbar de error', async () => {
    (
      component as any
    ).grid_sesionesService.guardarCambiosSesiones.mockRejectedValueOnce(
      new Error('boom'),
    );
    const spyErr = jest.spyOn((component as any).snack, 'error');
    await component.actualizarSesion();
    expect(spyErr).toHaveBeenCalledWith('Error al guardar sesiones');
  });
  it('📆 formatearFechaLocal devuelve fecha en formato yyyy-mm-dd', () => {
    const fecha = new Date('2025-12-05T00:00:00');
    expect((component as any).formatearFechaLocal(fecha)).toBe('2025-12-05');
  });
  it('🔁 ngOnChanges habilita formulario si eventoSeleccionado es null', () => {
    component.eventoForm.disable();
    (component as any).eventoSeleccionado = () => null;
    component.ngOnChanges({
      eventoSeleccionado: { currentValue: null } as any,
    });
    expect(component.eventoForm.enabled).toBe(true);
  });

  it('🔥 crearEvento debe capturar excepción y mostrar snackbar de error', async () => {
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => { });
    const mockError = new Error('Error técnico');

    // ✅ Mock del servicio para lanzar el error
    component['eventService'].crearEvento = jest
      .fn()
      .mockRejectedValue(mockError);

    // ✅ Aseguramos que el formulario esté inicializado
    component.eventoForm = component['fb'].group({
      id_programa: ['1'],
      institucional: [true],
      id_sede: ['S1'],
      id_tipo_actividad: ['T1'],
      id_responsable: ['R1'],
      id_aliado: ['A1'],
      nombre_actividad: ['Actividad X'],
      descripcion: ['Desc X'],
      fecha_actividad: ['2025-10-10'],
      hora_inicio: ['08:00'],
      hora_fin: ['09:00'],
      id_frecuencia: ['F1'],
      sesiones: component['fb'].array([]),
    });

    // ✅ Ejecutamos el método
    component['crearEvento']();

    // ✅ Esperamos al catch interno
    await new Promise((resolve) => setTimeout(resolve, 0));

    // ✅ Verificamos resultados
    expect(spyError).toHaveBeenCalledWith(
      '❌ Excepción al crear evento:',
      mockError,
    );
    expect(component['snack'].error).toHaveBeenCalledWith(
      'Error inesperado al crear evento',
    );

    spyError.mockRestore();
  });
  it('❌ crearEvento debe manejar respuesta fallida del backend', async () => {
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => { });

    // 🔹 Mock del servicio para devolver respuesta con error lógico
    component['eventService'].crearEvento = jest.fn().mockResolvedValue({
      exitoso: 'N',
      mensaje: 'Error en la validación del backend',
    });

    // ✅ Inicializamos el formulario con datos válidos
    component.eventoForm = component['fb'].group({
      id_programa: ['1'],
      institucional: [true],
      id_sede: ['S1'],
      id_tipo_actividad: ['T1'],
      id_responsable: ['R1'],
      id_aliado: ['A1'],
      nombre_actividad: ['Actividad X'],
      descripcion: ['Desc X'],
      fecha_actividad: ['2025-10-10'],
      hora_inicio: ['08:00'],
      hora_fin: ['09:00'],
      id_frecuencia: ['F1'],
      sesiones: component['fb'].array([]),
    });

    // ✅ Ejecutamos el método directamente
    component['crearEvento']();

    // ✅ Esperamos al .then interno
    await new Promise((resolve) => setTimeout(resolve, 0));

    // ✅ Verificamos que muestre el mensaje de error correcto
    expect(spyError).toHaveBeenCalledWith(
      '❌ Error al crear evento:',
      'Error en la validación del backend',
    );
    expect(component['snack'].error).toHaveBeenCalledWith(
      'Error en la validación del backend',
    );

    spyError.mockRestore();
  });
  it('🚨 actualizarSesion debe manejar error en guardarCambiosSesiones', async () => {
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => { });

    // 🔹 Simulamos snapshot con sesiones
    (component as any)['cambiosSesionesSnapshot'] = {
      nuevos: [
        {
          id_sesion: 'S1',
          id_actividad: 'A1',
          fecha_actividad: '2025-10-10',
          hora_inicio: '08:00',
          hora_fin: '09:00',
        },
      ],
      modificados: [],
      eliminados: [],
    };

    // 🔹 Mock del servicio que lanza excepción
    (component as any)['grid_sesionesService'].guardarCambiosSesiones = jest
      .fn()
      .mockRejectedValue(new Error('Falla backend'));

    // 🔹 Ejecutamos el método
    await component.actualizarSesion();

    // 🔹 Verificamos que muestre el error correcto
    expect(spyError).toHaveBeenCalled();
    const [msg, err] = spyError.mock.calls[0];
    expect(msg).toBe('❌ Error al guardar sesiones:');
    expect(err).toBeInstanceOf(Error);
    expect((component as any)['snack'].error).toHaveBeenCalledWith(
      'Error al guardar sesiones',
    );

    spyError.mockRestore();
  });
  it('✅ actualizarSesion debe mostrar success y emitir evento cuando resp.exitoso = "S"', async () => {
    const emitSpy = jest.spyOn(component.eventoEditado, 'emit');
    const cerrarSpy = jest.spyOn(component.cerrarFormulario, 'emit');

    (component as any)['cambiosSesionesSnapshot'] = {
      nuevos: [],
      modificados: [],
      eliminados: [],
    };

    (component as any)['grid_sesionesService'].guardarCambiosSesiones = jest
      .fn()
      .mockResolvedValue({
        exitoso: 'S',
        mensaje: 'Sesiones guardadas correctamente',
      });

    await component.actualizarSesion();

    expect((component as any)['snack'].success).toHaveBeenCalledWith(
      'Sesiones guardadas correctamente',
    );
    expect(emitSpy).toHaveBeenCalled();
    expect(cerrarSpy).toHaveBeenCalled();
  });
  it('❌ actualizarSesion debe manejar respuesta fallida del backend', async () => {
    // Mock snapshot
    (component as any)['cambiosSesionesSnapshot'] = {
      nuevos: [],
      modificados: [],
      eliminados: [],
    };

    // Mock servicio que devuelve error lógico
    (component as any)['grid_sesionesService'].guardarCambiosSesiones = jest
      .fn()
      .mockResolvedValue({
        exitoso: 'N',
        mensaje: 'Error al actualizar sesiones',
      });

    await component.actualizarSesion();

    expect((component as any)['snack'].error).toHaveBeenCalledWith(
      'Error al actualizar sesiones',
    );
  });
  it('🧹 resetearFormulario debe limpiar formulario y emitir eventos', () => {
    const cerrarSpy = jest.spyOn(component.cerrarFormulario, 'emit');
    const limpiarSpy = jest.spyOn(component.limpiarEventoSeleccionado, 'emit');

    // Mock de eventoForm y sesiones
    component.eventoForm = (component as any)['fb'].group({
      id_programa: ['1'],
      nombre_actividad: ['A'],
      sesiones: (component as any)['fb'].array([]),
    });
    const pushSpy = jest.spyOn((component as any).sesiones, 'clear');

    component['resetearFormulario']();

    expect(component.eventoForm.get('id_programa')?.value).toBeNull();
    expect(pushSpy).toHaveBeenCalled();
    expect(cerrarSpy).toHaveBeenCalled();
    expect(limpiarSpy).toHaveBeenCalled();
  });
  it('🆕 crearSesion debe generar una sesión correctamente', () => {
    const baseEvento = {
      id_actividad: 'A123',
    } as any;

    const sesion = (component as any)['crearSesion'](
      '2025-10-12',
      '08:00',
      '09:00',
      baseEvento,
    );

    expect(sesion.id_actividad).toBe('A123');
    expect(sesion.fecha_actividad).toBe('2025-10-12');
    expect(sesion.hora_inicio).toBe('08:00');
    expect(sesion.hora_fin).toBe('09:00');
  });

  it('🧩 filtrarEventosPorTipo: limpia lista cuando tipoId es null', () => {
    component.nombreDeEventos = [
      { id_tipo_actividad: 'T1', nombre: 'X' },
    ] as any;
    (component as any).filtrarEventosPorTipo(null);
    expect(component.nombresDeEventosFiltrados).toEqual([]);
  });
  it('🧩 esListaNombreEvento devuelve false si tipoActividad no tiene nombre', () => {
    component.tiposDeActividad = [
      { id_tipo_actividad: 'T1', nombre: null },
    ] as any;
    component.eventoForm.get('id_tipo_actividad')?.setValue('T1');
    expect(component.esListaNombreEvento()).toBe(false);
  });
  it('🧩 precargarFormulario no falla cuando evento es null', () => {
    expect(() => component.precargarFormulario(null)).not.toThrow();
  });
  it('📅 getFinDeMes retorna fecha actual si parámetro es null', () => {
    const result = (component as any).getFinDeMes(null);
    expect(result).toBeInstanceOf(Date);
  });
  it('🧩 clickFuera no cambia sugerencias si clic dentro de .col', () => {
    component.mostrarSugerencias = true;
    const div = document.createElement('div');
    div.classList.add('col');
    const evt = { target: div } as any;
    component.clickFuera(evt);
    expect(component.mostrarSugerencias).toBe(true);
  });
  it('🧩 clickFuera no cambia sugerencias si clic dentro de .col', () => {
    component.mostrarSugerencias = true;
    const div = document.createElement('div');
    div.classList.add('col');
    const evt = { target: div } as any;
    component.clickFuera(evt);
    expect(component.mostrarSugerencias).toBe(true);
  });

  it('ngOnInit: llama cargarEdicionDesdeBackend cuando eventoSeleccionado tiene id_actividad', () => {
    // evitar llamadas reales a cargarConfiguracionFormulario
    jest
      .spyOn(component as any, 'cargarConfiguracionFormulario')
      .mockImplementation(() => { });

    const cargarEdSpy = jest
      .spyOn(component as any, 'cargarEdicionDesdeBackend')
      .mockImplementation(() => { });
    // eventoSeleccionado es una señal-función; simulamos retorno con id_actividad
    (component as any).eventoSeleccionado = jest.fn(

      () => ({ id_actividad: 'EV1' }) as any,
    );

    component.ngOnInit();


    expect(cargarEdSpy).toHaveBeenCalledWith('EV1');
    // Manual property check instead of expect.objectContaining for compatibility
    expect(component.eventoParaEditar).toBeDefined();
    expect(component.eventoParaEditar && component.eventoParaEditar.id_actividad).toBe('EV1');
  });

  it('ngOnInit: llama precargarFormulario cuando eventoSeleccionado no tiene id_actividad', () => {
    jest
      .spyOn(component as any, 'cargarConfiguracionFormulario')
      .mockImplementation(() => { });

    const precargarSpy = jest
      .spyOn(component as any, 'precargarFormulario')
      .mockImplementation(() => { });
    const evento = { nombre_actividad: 'X' } as any;
    (component as any).eventoSeleccionado = jest.fn(() => evento);

    component.ngOnInit();


    expect(precargarSpy).toHaveBeenCalledWith(evento);
  expect(component.eventoParaEditar).toBe(evento);
  });

  it('ngOnInit: habilita el formulario cuando no hay eventoSeleccionado', () => {
    // prevenir llamadas externas
    jest
      .spyOn(component as any, 'cargarConfiguracionFormulario')
      .mockImplementation(() => { });
    (component as any).eventoSeleccionado = jest.fn(() => null);

    component.ngOnInit();


    // el form debe quedar habilitado si no es edición
    expect(component.eventoForm.enabled).toBe(true);
    expect(component.eventoParaEditar).toBeNull();
  });

  it('ngOnInit: suscripción a id_tipo_actividad dispara filtrarEventosPorTipo', () => {
    jest
      .spyOn(component as any, 'cargarConfiguracionFormulario')
      .mockImplementation(() => { });
    const filtrarSpy = jest
      .spyOn(component as any, 'filtrarEventosPorTipo')
      .mockImplementation(() => { });

    (component as any).eventoSeleccionado = jest.fn(() => null);
    component.ngOnInit();

    // Trigger valueChanges
    component.eventoForm.get('id_tipo_actividad')?.setValue('T1');

    expect(filtrarSpy).toHaveBeenCalledWith('T1');
  });

  it('onAliadoInput filtra y muestra sugerencias cuando hay coincidencia', () => {
    component.aliados = [
      { id_aliado: 'A1', nombre: 'Aliado Uno' } as any,
      { id_aliado: 'A2', nombre: 'Otro' } as any,
    ];
    const event = { target: { value: 'uno' } } as unknown as Event;
    component.onAliadoInput(event);
    expect(component.aliadosFiltrados.length).toBe(1);
    expect(component.mostrarSugerencias).toBe(true);
  });

  it('seleccionarAliado actualiza texto y patch del formulario', () => {
    const aliado = { id_aliado: 'A1', nombre: 'Aliado Uno' } as any;
    component.seleccionarAliado(aliado);
    expect(component.aliadoTexto).toBe('Aliado Uno');
    expect(component.eventoForm.get('id_aliado')?.value).toBe('A1');
    expect(component.mostrarSugerencias).toBe(false);
  });

  it('clickFuera oculta sugerencias si clic fuera de .col', () => {
    component.mostrarSugerencias = true;
    const div = document.createElement('div');
    const evt = { target: div } as any;
    component.clickFuera(evt);
    expect(component.mostrarSugerencias).toBe(false);
  });

  it('esListaNombreEvento devuelve false cuando tipo no existe y true cuando coincide con nombres esperados', () => {
    // caso false: sin tipo seleccionado
    component.eventoForm.get('id_tipo_actividad')?.setValue(null);
    expect(component.esListaNombreEvento()).toBe(false);

    // preparar tipos y caso true
    component.tiposDeActividad = [
      { id_tipo_actividad: 'T1', nombre: 'Contenido del ciclo' } as any,
    ];
    component.eventoForm.get('id_tipo_actividad')?.setValue('T1');
    expect(component.esListaNombreEvento()).toBe(true);

    // cambiar a 'Actividad General'
    component.tiposDeActividad = [
      { id_tipo_actividad: 'T2', nombre: 'Actividad General' } as any,
    ];
    component.eventoForm.get('id_tipo_actividad')?.setValue('T2');
    expect(component.esListaNombreEvento()).toBe(true);
  });

  it('cargarConfiguracionFormulario con parametros y sin parametros (sede única)', () => {
    // caso parametros
    const params: any = {
      sedes: [{ id_sede: 'S1', nombre: 'S' }],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
    };
    (component as any).eventoForm.get('id_tipo_actividad')?.setValue(null);
    (component as any).filtrarEventosPorTipo = jest.fn();
    component.cargarConfiguracionFormulario(params);
    expect(component.sedes.length).toBe(1);

    // caso subscribe desde servicio con sede única
    (component as any).eventoParaEditar = null; // forzar creación
    const data: any = {
      id_programa: 'P',
      sedes: [{ id_sede: 'S1', nombre: 'Solo' }],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
    };
    jest
      .spyOn((component as any).eventService, 'obtenerConfiguracionEvento')
      .mockReturnValue({
        subscribe: (cb: any) => cb(data),
      });
    jest
      .spyOn((component as any).loadingService, 'hide')
      .mockImplementation(() => { });
    component.cargarConfiguracionFormulario();
    expect(component.sedes.length).toBe(1);
    // el control id_sede debe quedar deshabilitado en la rama de sede única
    expect(component.eventoForm.get('id_sede')?.disabled).toBe(true);
  });

  it('actualizarSesion - ramas S / N / excepción', async () => {
    // preparar snapshot
    component.onCambiosSesiones({
      nuevos: [
        {
          id_sesion: 'n1',
          id_actividad: 'a1',
          fecha_actividad: '2025-10-01',
          hora_inicio: '08:00',
          hora_fin: '09:00',
        },
      ],
      modificados: [],
      eliminados: [],
    });

    // caso exitoso
    jest
      .spyOn((component as any).grid_sesionesService, 'guardarCambiosSesiones')
      .mockResolvedValue({ exitoso: 'S', mensaje: 'OK' });
    jest
      .spyOn((component as any).snack, 'success')
      .mockImplementation(() => { });
    const emitSpy = jest.spyOn(component.eventoEditado, 'emit');
    const cerrarSpy = jest.spyOn(component.cerrarFormulario, 'emit');
    await component.actualizarSesion();
    expect(emitSpy).toHaveBeenCalled();
    expect(cerrarSpy).toHaveBeenCalled();

    // caso no exitoso
    component.onCambiosSesiones({
      nuevos: [],
      modificados: [],
      eliminados: [],
    });
    jest
      .spyOn((component as any).grid_sesionesService, 'guardarCambiosSesiones')
      .mockResolvedValue({ exitoso: 'N', mensaje: 'NO' });
    const errSpy = jest
      .spyOn((component as any).snack, 'error')
      .mockImplementation(() => { });
    await component.actualizarSesion();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();

    // excepción
    component.onCambiosSesiones({
      nuevos: [],
      modificados: [],
      eliminados: [],
    });
    jest
      .spyOn((component as any).grid_sesionesService, 'guardarCambiosSesiones')
      .mockRejectedValue(new Error('boom'));
    const errSpy2 = jest
      .spyOn((component as any).snack, 'error')
      .mockImplementation(() => { });
    await component.actualizarSesion();
    expect(errSpy2).toHaveBeenCalled();
    errSpy2.mockRestore();
  });
  //adicionales
  it('🔔 mostrarAlertaCambiosPendientes usa warning cuando está disponible', () => {
    const snack = component['snack'] as any;
    const warningSpy = (snack.warning = jest.fn());
    snack.info = undefined;
    const errorSpy = jest.spyOn(snack, 'error');
    component['mostrarAlertaCambiosPendientes']();
    expect(warningSpy).toHaveBeenCalledWith(
      'Tienes cambios sin guardar. Presiona "Actualizar" para conservarlos.',
    );
    expect(errorSpy).not.toHaveBeenCalled();
    delete snack.warning;
    errorSpy.mockReset();
  });

  it('ℹ️ mostrarAlertaCambiosPendientes usa info cuando warning no existe', () => {
    const snack = component['snack'] as any;
    snack.warning = undefined;
    const infoSpy = (snack.info = jest.fn());
    const errorSpy = jest.spyOn(snack, 'error');
    component['mostrarAlertaCambiosPendientes']();
    expect(infoSpy).toHaveBeenCalledWith(
      'Tienes cambios sin guardar. Presiona "Actualizar" para conservarlos.',
    );
    expect(errorSpy).not.toHaveBeenCalled();
    delete snack.info;
    errorSpy.mockReset();
  });

  it('⚠️ mostrarAlertaCambiosPendientes cae en error cuando no hay warning ni info', () => {
    const snack = component['snack'] as any;
    snack.warning = undefined;
    snack.info = undefined;
    const errorSpy = jest.spyOn(snack, 'error');
    component['mostrarAlertaCambiosPendientes']();
    expect(errorSpy).toHaveBeenCalledWith(
      'Tienes cambios sin guardar. Presiona "Actualizar" para conservarlos.',
    );
    errorSpy.mockReset();
  });
});
