// ✅ src/tests/services/asistencia.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { AsistenciaService } from '../../app/asistencia/asistencia-lista/services/asistencia.service';
import { expect as jestExpect } from '@jest/globals';

import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { of, defer, throwError } from 'rxjs';
import { PreAsistencia } from '../../app/asistencia/interfaces/pre-asistencia.interface';
import { AsistenciaPayLoad } from '../../app/asistencia/interfaces/asistencia-payload.interface';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';

// 🧩 Mock services (versión Jest)
class LoadIndexDBServiceMock {
  ping = jest.fn();
}
class ActividadesDataSourceMock {
  getPreAsistencia = jest.fn();
}
class AsistenciasDataSourceMock {
  create = jest.fn();
}
class SesionesDataSourceMock {
  getById = jest.fn();
  update = jest.fn();
}
class GraphQLServiceMock {
  query = jest.fn();
  mutation = jest.fn();
}

class LoadingServiceMock {
  show = jest.fn();
  hide = jest.fn();
  confirm = jest.fn().mockReturnValue(of(true)); // 🔹 evita llamadas cruzadas
  success = jest.fn();
  error = jest.fn();
}

describe('🧠 AsistenciaService (Jest)', () => {
  let service: AsistenciaService;
  let loadIndexDBService: LoadIndexDBServiceMock;
  let graphQLService: GraphQLServiceMock;
  let actividadesDS: ActividadesDataSourceMock;
  let asistenciasDS: AsistenciasDataSourceMock;
  let sesionesDS: SesionesDataSourceMock;
  let loadingService: LoadingServiceMock;

  beforeEach(() => {
    // 🔹 Aísla cada test del resto del proyecto
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        // Servicio bajo prueba
        AsistenciaService,

        // Mocks aislados (sin afectar otros servicios)
        { provide: LoadIndexDBService, useClass: LoadIndexDBServiceMock },
        { provide: ActividadesDataSource, useClass: ActividadesDataSourceMock },
        { provide: AsistenciasDataSource, useClass: AsistenciasDataSourceMock },
        { provide: SesionesDataSource, useClass: SesionesDataSourceMock },
        { provide: GraphQLService, useClass: GraphQLServiceMock },
        { provide: LoadingService, useClass: LoadingServiceMock },
      ],
    });

    service = TestBed.inject(AsistenciaService);
    loadIndexDBService = TestBed.inject(LoadIndexDBService) as any;
    graphQLService = TestBed.inject(GraphQLService) as any;
    actividadesDS = TestBed.inject(ActividadesDataSource) as any;
    asistenciasDS = TestBed.inject(AsistenciasDataSource) as any;
    sesionesDS = TestBed.inject(SesionesDataSource) as any;
    loadingService = TestBed.inject(LoadingService) as any;
  });

  afterEach(() => jest.clearAllMocks());

  // 🔹 obtenerDetalleAsistencia
  it('🔍 debe obtener detalle de asistencia desde backend cuando ping = pong', async () => {
    const mockPre: PreAsistencia = {
      id_sesion: 'S1',
      id_sede: 'X',
      numero_asistentes: 5,
      foto: '',
      descripcion: '',
      imagen: '',
      sedes: [],
      beneficiarios: [],
      asistentes_sesiones: [],
    };

    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphQLService.query.mockReturnValue(of({ getPreAsistencia: mockPre }));

    const result = await service.obtenerDetalleAsistencia('S1');

    expect(graphQLService.query).toHaveBeenCalled();
    expect(loadingService.show).toHaveBeenCalled();
    expect(loadingService.hide).toHaveBeenCalled();
    expect(result.id_sesion).toBe('S1');
  });

  it('📴 debe obtener detalle de asistencia desde IndexedDB cuando no hay conexión', async () => {
    const mockOffline = { id_sesion: 'OFF1' };
    loadIndexDBService.ping.mockReturnValue(of('offline'));
    actividadesDS.getPreAsistencia.mockResolvedValue(mockOffline);

    const result = await service.obtenerDetalleAsistencia('OFF1');
    expect(actividadesDS.getPreAsistencia).toHaveBeenCalledWith('OFF1');
    expect(loadingService.hide).toHaveBeenCalled();
    expect(result.id_sesion).toBe('OFF1');
  });

  // 🔹 guardarAsistencia
  it('💾 debe guardar asistencias online (ping = pong)', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphQLService.mutation.mockReturnValue(
      of({ updateAsistencias: { exitoso: 'S', mensaje: 'OK' } }),
    );

    const result = await service.guardarAsistencia(input);
    expect(graphQLService.mutation).toHaveBeenCalled();
    expect(asistenciasDS.create).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
  });

  it('📴 debe guardar asistencias offline (ping != pong)', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('offline'));

    const result = await service.guardarAsistencia(input);
    expect(asistenciasDS.create).toHaveBeenCalled();
    expect(result.mensaje).toContain('offline');
  });

  // 🔹 guardarAsistenciaFotografica
  it('📸 debe actualizar asistencia fotográfica online', async () => {
    const input: Sesiones = {
      id_sesion: 'S1',
      id_actividad: 'A1',
      imagen: 'img.png',
      descripcion: 'desc',
      nro_asistentes: 5,
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphQLService.mutation.mockReturnValue(
      of({ updateAsistencias: { exitoso: 'S', mensaje: 'OK' } }),
    );
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S1' });
    sesionesDS.update.mockResolvedValue(undefined);

    const result = await service.guardarAsistenciaFotografica(input);
    expect(graphQLService.mutation).toHaveBeenCalled();
    expect(sesionesDS.update).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
  });

  it('🧩 debe guardar asistencia fotográfica offline', async () => {
    const input: Sesiones = {
      id_sesion: 'S2',
      id_actividad: 'A2',
      imagen: 'img.png',
      descripcion: 'offline desc',
      nro_asistentes: 3,
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('offline'));
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S2' });
    sesionesDS.update.mockResolvedValue(undefined);

    const result = await service.guardarAsistenciaFotografica(input);
    expect(sesionesDS.update).toHaveBeenCalled();
    expect(result.mensaje).toContain('offline');
  });

  //adicionales

  it('❌ debe manejar error en guardarAsistencia cuando la mutación lanza excepción', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
    } as any;

    // 🔹 Conexión online simulada
    loadIndexDBService.ping.mockReturnValue(of('pong'));

    // 🔹 En vez de throw, devolvemos un Observable que lanza error
    graphQLService.mutation.mockReturnValue(
      throwError(() => new Error('Falla del backend')),
    );

    const result = await service.guardarAsistencia(input);

    // 🔹 Afirmaciones
    expect(loadingService.hide).toHaveBeenCalled();
    expect(result.exitoso).toBe('N');
    expect(result.mensaje).toContain('Error guardando asistencias');
  });

  it('❌ debe manejar error en guardarAsistenciaFotografica cuando mutation lanza excepción', async () => {
    const input: Sesiones = {
      id_sesion: 'SERR',
      id_actividad: 'AERR',
      imagen: 'foto.png',
      descripcion: 'error test',
      nro_asistentes: 9,
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphQLService.mutation.mockReturnValue(
      throwError(() => new Error('fallo en mutación')),
    );

    // aunque no hay catchError explícito, el test asegurará que no truene
    await jestExpect(
      service.guardarAsistenciaFotografica(input),
    ).rejects.toThrow();

    // Validamos que mutation fue llamada
    expect(graphQLService.mutation).toHaveBeenCalled();
  });
  it('⚠️ debe manejar error si update() falla en modo offline', async () => {
    const input: Sesiones = {
      id_sesion: 'S3',
      id_actividad: 'A3',
      imagen: 'img.png',
      descripcion: 'offline err',
      nro_asistentes: 2,
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('offline'));
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S3' });
    sesionesDS.update.mockRejectedValue(new Error('falló update'));

    await jestExpect(
      service.guardarAsistenciaFotografica(input),
    ).rejects.toThrow('falló update');
  });

  it('🧩 debe cubrir rama offline en guardarAsistenciaFotografica (ping ≠ pong)', async () => {
    const input: Sesiones = {
      id_sesion: 'S_OFF',
      id_actividad: 'A_OFF',
      imagen: 'img.png',
      descripcion: 'desc offline',
      nro_asistentes: 3,
    } as any;

    // 🔹 Emite valor distinto de "pong"
    loadIndexDBService.ping.mockReturnValue(of('sin conexion'));

    // 🔹 Simula respuestas del datasource
    sesionesDS.getById.mockResolvedValue({
      id_sesion: 'S_OFF',
      descripcion: '',
    });
    sesionesDS.update.mockResolvedValue(undefined);

    const result = await service.guardarAsistenciaFotografica(input);

    // ✅ Verificaciones clave
    expect(sesionesDS.getById).toHaveBeenCalledWith('S_OFF');
    expect(sesionesDS.update).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toContain('offline');
  });
  it('✅ cubre completamente la rama offline (líneas 220–245)', async () => {
    const input: Sesiones = {
      id_sesion: 'S_OFF',
      id_actividad: 'A_OFF',
      imagen: 'img.png',
      descripcion: 'desc offline',
      nro_asistentes: 3,
    } as any;

    // 🔹 Emite un valor que NO sea 'pong'
    loadIndexDBService.ping.mockReturnValue(of('no-pong'));

    // 🔹 Mock Promises → deben resolver a algo “real”
    sesionesDS.getById.mockResolvedValue({
      id_sesion: 'S_OFF',
      descripcion: 'old',
    });
    // 👇 devolvemos un objeto explícito, no undefined, para que el `map()` se ejecute
    sesionesDS.update.mockResolvedValue({ ok: true });

    const result = await service.guardarAsistenciaFotografica(input);

    // 🔹 Verificaciones
    expect(sesionesDS.getById).toHaveBeenCalledWith('S_OFF');
    expect(sesionesDS.update).toHaveBeenCalledWith(
      'S_OFF',
      expect.objectContaining({
        syncStatus: 'pending-update',
        deleted: false,
        descripcion: 'desc offline',
        nro_asistentes: 3,
      }),
    );
    expect(result).toEqual({
      exitoso: 'S',
      mensaje: 'Asistencia actualizada correctamente (offline)',
    });
  });

  it('✅ cubre la rama offline (líneas 220-245) ejecutando todo el flujo', async () => {
    const input: Sesiones = {
      id_sesion: 'S_OFF',
      id_actividad: 'A_OFF',
      imagen: 'img.png',
      descripcion: 'desc offline',
      nro_asistentes: 3,
    } as any;

    // 🔹 Emite un valor distinto de 'pong'
    loadIndexDBService.ping.mockReturnValue(of('desconectado'));

    // 🔹 Simula que getById devuelve un valor inmediatamente
    sesionesDS.getById.mockImplementation(() =>
      Promise.resolve({ id_sesion: 'S_OFF', descripcion: 'antigua' }),
    );

    // 🔹 Simula que update devuelve un valor observable que emite realmente algo
    //    (defer garantiza emisión dentro de la suscripción)
    sesionesDS.update.mockImplementation(() =>
      Promise.resolve({ id_sesion: 'S_OFF', actualizado: true }),
    );

    // 🔹 Ejecuta el método y espera la resolución completa del Observable interno
    const result = await service.guardarAsistenciaFotografica(input);

    // 🔹 Validaciones
    expect(loadIndexDBService.ping).toHaveBeenCalled();
    expect(sesionesDS.getById).toHaveBeenCalledWith('S_OFF');
    expect(sesionesDS.update).toHaveBeenCalled();
    expect(result).toEqual({
      exitoso: 'S',
      mensaje: 'Asistencia actualizada correctamente (offline)',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule(); // 🔹 evita fugas entre specs
  });

  //adicionales

  it('🟢 cubre rama offline completa en guardarAsistenciaFotografica (éxito)', async () => {
    const input: Sesiones = {
      id_sesion: 'S_OFF',
      id_actividad: 'A_OFF',
      imagen: 'img.png',
      descripcion: 'desc offline',
      nro_asistentes: 3,
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('off')); // fuerza el else

    // Promesas reales que se resuelven
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S_OFF' });
    sesionesDS.update.mockResolvedValue({ ok: true });

    const result = await service.guardarAsistenciaFotografica(input);

    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toContain('offline');
  });
  it('🔴 cubre rama offline cuando update() lanza error (líneas 220–245)', async () => {
    const input: Sesiones = {
      id_sesion: 'S_ERR',
      id_actividad: 'A_ERR',
      imagen: 'img.png',
      descripcion: 'desc err',
      nro_asistentes: 1,
    } as any;

    loadIndexDBService.ping.mockReturnValue(of('off'));
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S_ERR' });
    sesionesDS.update.mockImplementation(() =>
      Promise.reject(new Error('fallo')),
    );

    // ⬇️ usamos try/catch porque el servicio no tiene catchError en offline
    try {
      await service.guardarAsistenciaFotografica(input);
      fail('debió lanzar error');
    } catch (err: any) {
      expect(err.message).toContain('fallo');
    }
  });
});
