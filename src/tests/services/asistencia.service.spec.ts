import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AsistenciaService } from '../../app/asistencia/asistencia-lista/services/asistencia.service';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { LoadingService } from '../../app/shared/services/loading.service';

import { AsistenciaPayLoad } from '../../app/asistencia/interfaces/asistencia-payload.interface';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';
import { PreAsistencia } from '../../app/asistencia/interfaces/pre-asistencia.interface';
import { GraphQLResponse } from '../../app/shared/interfaces/graphql-response.interface';

// 🧱 Mocks
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
}

describe('🧠 AsistenciaService (Refactor Completo)', () => {
  let service: AsistenciaService;
  let loadIndexDB: LoadIndexDBServiceMock;
  let actividadesDS: ActividadesDataSourceMock;
  let asistenciasDS: AsistenciasDataSourceMock;
  let sesionesDS: SesionesDataSourceMock;
  let graphQL: GraphQLServiceMock;
  let loading: LoadingServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AsistenciaService,
        { provide: LoadIndexDBService, useClass: LoadIndexDBServiceMock },
        { provide: ActividadesDataSource, useClass: ActividadesDataSourceMock },
        { provide: AsistenciasDataSource, useClass: AsistenciasDataSourceMock },
        { provide: SesionesDataSource, useClass: SesionesDataSourceMock },
        { provide: GraphQLService, useClass: GraphQLServiceMock },
        { provide: LoadingService, useClass: LoadingServiceMock },
      ],
    });

    service = TestBed.inject(AsistenciaService);
    loadIndexDB = TestBed.inject(LoadIndexDBService) as any;
    actividadesDS = TestBed.inject(ActividadesDataSource) as any;
    asistenciasDS = TestBed.inject(AsistenciasDataSource) as any;
    sesionesDS = TestBed.inject(SesionesDataSource) as any;
    graphQL = TestBed.inject(GraphQLService) as any;
    loading = TestBed.inject(LoadingService) as any;
  });

  afterEach(() => jest.clearAllMocks());

  // 🔹 obtenerDetalleAsistencia
  it('🔍 obtiene detalle desde backend (ping = pong)', async () => {
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
    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.query.mockReturnValue(of({ getPreAsistencia: mockPre }));

    const result = await service.obtenerDetalleAsistencia('S1');

    expect(graphQL.query).toHaveBeenCalled();
    expect(result.id_sesion).toBe('S1');
    expect(loading.hide).toHaveBeenCalled();
  });

  it('📴 obtiene detalle desde IndexedDB cuando offline', async () => {
    const mockOffline = { id_sesion: 'OFF1' };
    loadIndexDB.ping.mockReturnValue(of('offline'));
    actividadesDS.getPreAsistencia.mockResolvedValue(mockOffline);

    const result = await service.obtenerDetalleAsistencia('OFF1');
    expect(result.id_sesion).toBe('OFF1');
    expect(loading.hide).toHaveBeenCalled();
  });

  // 🔹 guardarAsistencia
  it('💾 guarda asistencias online (ping = pong)', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
    } as any;
    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.mutation.mockReturnValue(
      of({ updateAsistencias: { exitoso: 'S', mensaje: 'OK' } }),
    );

    const result = await service.guardarAsistencia(input);
    expect(result.exitoso).toBe('S');
    expect(asistenciasDS.create).toHaveBeenCalled();
  });

  it('📴 guarda asistencias offline', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P2', id_sesion: 'S2', id_asistencia: 'A2' }],
    } as any;
    loadIndexDB.ping.mockReturnValue(of('offline'));

    const result = await service.guardarAsistencia(input);
    expect(result.mensaje).toContain('offline');
    expect(asistenciasDS.create).toHaveBeenCalled();
  });

  it('❌ maneja error en guardarAsistencia', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
    } as any;
    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.mutation.mockReturnValue(
      throwError(() => new Error('Falla backend')),
    );

    const result = await service.guardarAsistencia(input);
    expect(result.exitoso).toBe('N');
    expect(result.mensaje).toContain('Error guardando asistencias');
  });

  // 🔹 guardarAsistenciaFotografica
  it('📸 actualiza asistencia fotográfica online', async () => {
    const input: Sesiones = {
      id_sesion: 'S1',
      id_actividad: 'A1',
      imagen: 'img.png',
      descripcion: 'desc',
      nro_asistentes: 5,
    } as any;

    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.mutation.mockReturnValue(
      of({ updateAsistencias: { exitoso: 'S', mensaje: 'OK' } }),
    );
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S1' });
    sesionesDS.update.mockResolvedValue(undefined);

    const result = await service.guardarAsistenciaFotografica(input);
    expect(result.exitoso).toBe('S');
    expect(sesionesDS.update).toHaveBeenCalled();
  });

  it('🧩 guarda asistencia fotográfica offline', async () => {
    const input: Sesiones = {
      id_sesion: 'S2',
      id_actividad: 'A2',
      imagen: 'img.png',
      descripcion: 'offline desc',
      nro_asistentes: 3,
    } as any;

    loadIndexDB.ping.mockReturnValue(of('offline'));
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S2' });
    sesionesDS.update.mockResolvedValue({ ok: true });

    const result = await service.guardarAsistenciaFotografica(input);
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toContain('offline');
  });

  it('❌ maneja error en guardarAsistenciaFotografica online', async () => {
    const input: Sesiones = {
      id_sesion: 'SERR',
      id_actividad: 'AERR',
      imagen: 'foto.png',
      descripcion: 'error test',
      nro_asistentes: 9,
    } as any;

    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.mutation.mockReturnValue(
      throwError(() => new Error('fallo en mutación')),
    );

    const result = await service.guardarAsistenciaFotografica(input);
    expect(result.exitoso).toBe('N');
  });

  it('⚠️ lanza error si update() falla offline', async () => {
    const input: Sesiones = {
      id_sesion: 'S_ERR',
      id_actividad: 'A_ERR',
      imagen: 'img.png',
      descripcion: 'desc err',
      nro_asistentes: 1,
    } as any;

    loadIndexDB.ping.mockReturnValue(of('offline'));
    sesionesDS.getById.mockResolvedValue({ id_sesion: 'S_ERR' });
    sesionesDS.update.mockImplementation(() =>
      Promise.reject(new Error('falló update')),
    );

    await expect(service.guardarAsistenciaFotografica(input)).rejects.toThrow(
      'falló update',
    );
  });

  // 🔹 TESTS PRIVADOS DIRECTOS
  describe('🔒 Métodos privados', () => {
    it('procesarAsistenciaOnline crea asistencias y retorna el resultado', () => {
      const input = {
        nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
      } as any;
      const result = (service as any).procesarAsistenciaOnline(
        { exitoso: 'S', mensaje: 'OK' },
        input,
      );
      expect(result.exitoso).toBe('S');
      expect(asistenciasDS.create).toHaveBeenCalled();
      expect(loading.hide).toHaveBeenCalled();
    });

    it('manejarErrorAsistencia devuelve Observable con mensaje de error', (done) => {
      (service as any)
        .manejarErrorAsistencia('error-test')
        .subscribe((r: GraphQLResponse) => {
          expect(r.exitoso).toBe('N');
          expect(r.mensaje).toContain('error-test');
          done();
        });
    });

    it('guardarAsistenciaOffline crea asistencias con syncStatus pending-create', (done) => {
      const input = {
        nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
      } as any;
      (service as any)
        .guardarAsistenciaOffline(input)
        .subscribe((res: GraphQLResponse) => {
          expect(asistenciasDS.create).toHaveBeenCalled();
          expect(res.exitoso).toBe('S');
          done();
        });
    });

    it('respuestaOffline devuelve mensaje correcto y llama hide()', () => {
      const res = (service as any).respuestaOffline();
      expect(res.mensaje).toContain('offline');
      expect(loading.hide).toHaveBeenCalled();
    });
  });
  it('🔴 cubre catchError de guardarAsistenciaFotograficaOnline', (done) => {
    const input: Sesiones = {
      id_sesion: 'S_ERR2',
      id_actividad: 'A_ERR2',
      imagen: 'x.png',
      descripcion: 'error interno',
      nro_asistentes: 7,
    } as any;

    // Simula que la mutación lanza error dentro del flujo RxJS
    graphQL.mutation.mockReturnValueOnce(
      throwError(() => new Error('Error interno')),
    );

    (service as any)
      .guardarAsistenciaFotograficaOnline(input)
      .subscribe((res: GraphQLResponse) => {
        // ✅ Verifica que se fue por catchError
        expect(res.exitoso).toBe('N');
        expect(res.mensaje).toContain(
          'Error al actualizar asistencia fotográfica',
        );
        expect(loading.hide).toHaveBeenCalled();
        done();
      });
  });
});
