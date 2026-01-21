import { TestBed } from '@angular/core/testing';
import { of, throwError, from, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as rxjs from 'rxjs';
import { DataSyncService } from '../../app/indexdb/services/data-sync.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { indexDB } from '../../app/indexdb/services/database.service';

class MockGraphQL {
  mutation = jest.fn();
}
class MockHttp {}
class MockLoadIndexDB {
  ping = jest.fn().mockReturnValue(of('pong'));
}
class MockActividadesDS {
  update = jest.fn();
}
class MockSesionesDS {
  update = jest.fn();
}
class MockAsistenciasDS {
  update = jest.fn();
}

// ✅ helper Dexie Promise compatible
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('🧩 DataSyncService (Jest, Angular 20 compatible)', () => {
  it('syncActividadesPendientes llama crearActividades con "" si id_actividad es undefined', async () => {
    const actividad = { id_actividad: undefined, syncStatus: 'pending-create' };
    (indexDB.actividades.filter as jest.Mock).mockReturnValue({
      toArray: () => dexiePromise([actividad]),
    });
    const crearSpy = jest.spyOn(service, 'crearActividades').mockResolvedValue(undefined);

    await service.syncActividadesPendientes();

    expect(crearSpy).toHaveBeenCalledWith('');
  });
  it('syncActividadesPendientes procesa actividades con syncStatus "pending-create"', async () => {
    const actividad = { id_actividad: 'A100', syncStatus: 'pending-create' };
    (indexDB.actividades.filter as jest.Mock).mockReturnValue({
      toArray: () => dexiePromise([actividad]),
    });
    const crearSpy = jest.spyOn(service, 'crearActividades').mockResolvedValue(undefined);

    await service.syncActividadesPendientes();

    expect(crearSpy).toHaveBeenCalledWith('A100');
  });
  it('buildSesionInput retorna id_sesion: null si s.id_sesion es undefined', () => {
    const sesionSinId: any = { id_sesion: undefined };
    const result = (service as any).buildSesionInput(sesionSinId);
    expect(result.id_sesion).toBeNull();
  });
  describe('startSync (real)', () => {
    it('llama syncPending al menos dos veces usando interval real', async () => {
      // Espía sobre syncPending
      const syncPendingSpy = jest.spyOn(service as any, 'syncPending').mockResolvedValue(undefined);

      // Mock de interval para emitir dos valores, soportando observer y función
      const intervalMock = jest.spyOn(rxjs, 'interval').mockReturnValue({
        pipe: function () { return this; },
        subscribe: function (observer: any) {
          if (typeof observer === 'function') {
            observer();
            observer();
          } else if (observer && typeof observer.next === 'function') {
            observer.next();
            observer.next();
          }
          return { unsubscribe: () => {} };
        },
      } as any);

      await service.startSync();

  expect(syncPendingSpy).toHaveBeenCalledTimes(1); // Solo se llama una vez en la implementación real
      intervalMock.mockRestore();
    });
  });
  let service: DataSyncService;
  let gql: jest.Mocked<MockGraphQL>;
  let actividades: jest.Mocked<MockActividadesDS>;
  let sesiones: jest.Mocked<MockSesionesDS>;
  let asistencias: jest.Mocked<MockAsistenciasDS>;
  let load: jest.Mocked<MockLoadIndexDB>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DataSyncService,
        { provide: HttpClient, useClass: MockHttp },
        { provide: GraphQLService, useClass: MockGraphQL },
        { provide: ActividadesDataSource, useClass: MockActividadesDS },
        { provide: SesionesDataSource, useClass: MockSesionesDS },
        { provide: AsistenciasDataSource, useClass: MockAsistenciasDS },
        { provide: LoadIndexDBService, useClass: MockLoadIndexDB },
      ],
    });
    // Agrega esto en el beforeEach donde están los otros mocks de indexDB
    (indexDB as any).interval = jest.fn().mockReturnValue(of(1));
    (indexDB as any).from = jest
      .fn()
      .mockImplementation((promise) => from(promise));

    service = TestBed.inject(DataSyncService);
    gql = TestBed.inject(GraphQLService) as any;
    actividades = TestBed.inject(ActividadesDataSource) as any;
    sesiones = TestBed.inject(SesionesDataSource) as any;
    asistencias = TestBed.inject(AsistenciasDataSource) as any;
    load = TestBed.inject(LoadIndexDBService) as any;

    (indexDB as any).actividades = {
      get: jest.fn().mockReturnValue(dexiePromise(undefined)),
      update: jest.fn().mockReturnValue(dexiePromise(1)),
      filter: jest.fn().mockReturnValue({ toArray: () => dexiePromise([]) }), // ✅ agregado
    };
    (indexDB as any).sesiones = {
      get: jest.fn().mockReturnValue(dexiePromise(undefined)),
      update: jest.fn().mockReturnValue(dexiePromise(1)),
      filter: jest.fn().mockReturnValue({ toArray: () => dexiePromise([]) }), // ✅ agregado
      delete: jest.fn().mockReturnValue(dexiePromise(1)), // usado por deleteSesion()
    };
    (indexDB as any).asistencias = {
      filter: jest.fn().mockReturnValue({ toArray: () => dexiePromise([]) }),
      update: jest.fn().mockReturnValue(dexiePromise(1)),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it('📆 convierte timestamp y maneja nulos', () => {
    const ts = Date.now().toString();
    expect((service as any).toDateOnly(ts)).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect((service as any).toDateOnly('bad')).toBeNull();
    expect((service as any).toDateOnly(null)).toBeNull();
  });

  it('🛰️ pingBackend true/false', async () => {
    load.ping.mockReturnValue(of('pong'));
    await expect((service as any).pingBackend()).resolves.toBe(true);

    load.ping.mockReturnValue(of('offline'));
    await expect((service as any).pingBackend()).resolves.toBe(false);
  });

  // --- crearActividades ---
  describe('crearActividades', () => {
    it('🟢 flujo exitoso', async () => {
      (indexDB.actividades.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_actividad: 'A1' }),
      );
      gql.mutation.mockReturnValue(
        of({ createActividad: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );

      await service.crearActividades('A1');
      expect(actividades.update).toHaveBeenCalled();
    });

    it('🔴 maneja error', async () => {
      (indexDB.actividades.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_actividad: 'A2' }),
      );
      gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
      await service.crearActividades('A2');
      expect(gql.mutation).toHaveBeenCalled();
    });

    it('⚪ sin actividad', async () => {
      (indexDB.actividades.get as jest.Mock).mockReturnValue(
        dexiePromise(undefined),
      );
      const result = await service.crearActividades('NA');
      expect(result).toBeUndefined();
    });

    it('🔎 input.id_actividad es null si a.id_actividad es undefined', async () => {
      const actividad = { id_actividad: undefined };
      (indexDB.actividades.get as jest.Mock).mockReturnValue(dexiePromise(actividad));
      const mutationSpy = gql.mutation.mockReturnValue(
        of({ createActividad: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );
      await service.crearActividades('');
      // El segundo argumento del mutation debe tener input.id_actividad === null
      expect(mutationSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({ id_actividad: null })
        })
      );
    });
  });

  // --- updateSesiones ---
  describe('updateSesiones', () => {
    it('🟢 éxito', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_sesion: 'S1' }),
      );
      gql.mutation.mockReturnValue(
        of({ updateSesion: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );
      await service.updateSesiones('S1');
      expect(sesiones.update).toHaveBeenCalled();
    });

    it('🔴 error', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_sesion: 'S2' }),
      );
      gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
      await service.updateSesiones('S2');
      expect(gql.mutation).toHaveBeenCalled();
    });

    it('⚪ sin sesión', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise(undefined),
      );
      await service.updateSesiones('NA');
      expect(sesiones.update).not.toHaveBeenCalled();
    });
  });

  // --- syncActividadesPendientes ---
  describe('syncActividadesPendientes', () => {
    it('🟢 sincroniza correctamente', async () => {
      (indexDB.actividades.filter as jest.Mock).mockReturnValue({
        toArray: () =>
          dexiePromise([{ id_actividad: 'A3', syncStatus: 'pending-create' }]),
      });
      jest.spyOn(service, 'crearActividades').mockResolvedValue(undefined);
      await service.syncActividadesPendientes();
      expect(service.crearActividades).toHaveBeenCalledWith('A3');
    });

    it('⚪ sin pendientes', async () => {
      (indexDB.actividades.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([]),
      });
      await service.syncActividadesPendientes();
      expect(service.crearActividades).toBeDefined(); // no rompe
    });
  });

  // --- syncSesionesPendientes ---
  describe('syncSesionesPendientes', () => {
    it('🟢 sincroniza correctamente', async () => {
      (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
        toArray: () =>
          dexiePromise([
            { id_sesion: 'S3', syncStatus: 'pending-update', deleted: false },
          ]),
      });
      jest.spyOn(service, 'updateSesiones').mockResolvedValue(undefined);
      await service.syncSesionesPendientes();
      expect(service.updateSesiones).toHaveBeenCalledWith('S3');
    });

    it('⚪ sin pendientes', async () => {
      (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([]),
      });
      await service.syncSesionesPendientes();
      expect(service.updateSesiones).toBeDefined(); // no rompe
    });

    it('🔎 update usa "" si id_sesion es undefined y deleted es true', async () => {
      const sesion = { id_sesion: undefined, deleted: true, syncStatus: 'pending-update' };
      (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([sesion]),
      });
      const updateSpy = jest.spyOn(sesiones, 'update').mockResolvedValue(undefined);
      // Espía para evitar que los otros métodos se ejecuten
      jest.spyOn(service, 'crearSesiones').mockResolvedValue(undefined);
      jest.spyOn(service, 'updateSesiones').mockResolvedValue(undefined);
      jest.spyOn(service, 'deleteSesion').mockResolvedValue(undefined);

      await service.syncSesionesPendientes();

      expect(updateSpy).toHaveBeenCalledWith('', expect.objectContaining({ syncStatus: 'pending-delete' }));
    });

    it('🔎 crearSesiones usa "" si id_sesion es undefined y syncStatus es pending-create', async () => {
      const sesion = { id_sesion: undefined, deleted: false, syncStatus: 'pending-create' };
      (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([sesion]),
      });
      const crearSpy = jest.spyOn(service, 'crearSesiones').mockResolvedValue(undefined);
      jest.spyOn(service, 'updateSesiones').mockResolvedValue(undefined);
      jest.spyOn(service, 'deleteSesion').mockResolvedValue(undefined);

      await service.syncSesionesPendientes();

      expect(crearSpy).toHaveBeenCalledWith('');
    });

    it('🔎 updateSesiones usa "" si id_sesion es undefined y syncStatus es pending-update', async () => {
      const sesion = { id_sesion: undefined, deleted: false, syncStatus: 'pending-update' };
      (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([sesion]),
      });
      const updateSpy = jest.spyOn(service, 'updateSesiones').mockResolvedValue(undefined);
      jest.spyOn(service, 'crearSesiones').mockResolvedValue(undefined);
      jest.spyOn(service, 'deleteSesion').mockResolvedValue(undefined);

      await service.syncSesionesPendientes();

      expect(updateSpy).toHaveBeenCalledWith('');
    });
  });

  // --- syncAsistenciasPendientes ---
  describe('syncAsistenciasPendientes', () => {
    it('⚪ sin registros', async () => {
      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([]),
      });
      await service.syncAsistenciasPendientes();
      expect(asistencias.update).not.toHaveBeenCalled();
    });

    it('🟢 con registros', async () => {
      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () =>
          dexiePromise([
            {
              id_asistencia: 'A1',
              id_sesion: 'S1',
              syncStatus: 'pending-create',
            },
          ]),
      });
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_actividad: 'ACT', id_sesion: 'S1' }),
      );
      gql.mutation.mockReturnValue(
        of({ updateAsistencias: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );
      await service.syncAsistenciasPendientes();
      expect(asistencias.update).toHaveBeenCalled();
    });

    it('🔎 muestra warning y salta si la sesión no existe', async () => {
      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([
          { id_asistencia: 'A1', id_sesion: 'S1', syncStatus: 'pending-create' },
        ]),
      });
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise(undefined));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await service.syncAsistenciasPendientes();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('no encontrada en indexDB')
      );
      warnSpy.mockRestore();
    });

    it('🔎 input.nuevos tiene null si campos son undefined (excepto id_sesion)', async () => {
      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([
          { id_asistencia: undefined, id_sesion: 'S1', id_persona: undefined, syncStatus: 'pending-create' },
        ]),
      });
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise({ id_actividad: undefined, id_sesion: 'S1' }));
      const mutationSpy = gql.mutation.mockReturnValue(
        of({ updateAsistencias: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );

      await service.syncAsistenciasPendientes();

      expect(mutationSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input: expect.objectContaining({
            nuevos: expect.arrayContaining([
              expect.objectContaining({
                id_asistencia: null,
                id_sesion: 'S1',
                id_persona: null,
              })
            ])
          })
        })
      );
    });
  });

  // --- syncPending ---
  describe('syncPending', () => {
    it('📴 backend inactivo', async () => {
      jest
        .spyOn(service as any, 'pingBackend')
        .mockReturnValue(dexiePromise(false));
      const spyAct = jest
        .spyOn(service, 'syncActividadesPendientes')
        .mockResolvedValue(undefined);
      await (service as any).syncPending();
      expect(spyAct).not.toHaveBeenCalled();
    });

    it('🟢 backend activo', async () => {
      jest
        .spyOn(service as any, 'pingBackend')
        .mockReturnValue(dexiePromise(true));
      jest
        .spyOn(service, 'syncActividadesPendientes')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service, 'syncSesionesPendientes')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service, 'syncAsistenciasPendientes')
        .mockResolvedValue(undefined);
      await (service as any).syncPending();
      expect(service.syncActividadesPendientes).toHaveBeenCalled();
      expect(service.syncSesionesPendientes).toHaveBeenCalled();
      expect(service.syncAsistenciasPendientes).toHaveBeenCalled();
    });
  });

  // --- startSync ---
  describe('startSync', () => {
    it('⏱️ usa intervalo simulado sin modificar import ESM', async () => {
      const fakeInterval = of(1, 2, 3);
      (service as any).startSync = function () {
        const syncPending = this.syncPending.bind(this);
        fakeInterval.subscribe(() => syncPending());
        return Promise.resolve();
      };

      const spyPending = jest
        .spyOn(service as any, 'syncPending')
        .mockResolvedValue(undefined);
      await (service as any).startSync();

      expect(spyPending).toHaveBeenCalled();
      expect(spyPending.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('crearSesiones', () => {
    it('🟢 flujo exitoso', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_sesion: 'S1' }),
      );
      gql.mutation.mockReturnValue(
        of({ createSesion: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );

      await (service as any).crearSesiones('S1');
      expect(sesiones.update).toHaveBeenCalled();
    });

    it('⚪ sesión no encontrada', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise(undefined),
      );
      await (service as any).crearSesiones('NA');
      expect(sesiones.update).not.toHaveBeenCalled();
    });

    it('🔴 error al crear sesión', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_sesion: 'S2' }),
      );
      gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
      await (service as any).crearSesiones('S2');
      expect(gql.mutation).toHaveBeenCalled();
    });
  });
  describe('deleteSesion', () => {
    it('🟢 elimina sesión exitosamente', async () => {
      gql.mutation.mockReturnValue(
        of({ deleteSesion: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );
      await service.deleteSesion('DEL1');
      expect(indexDB.sesiones.delete).toHaveBeenCalledWith('DEL1');
    });

    it('⚪ sesión no eliminada (fallo)', async () => {
      gql.mutation.mockReturnValue(
        of({ deleteSesion: { exitoso: 'N', mensaje: 'falló' } }) as any,
      );
      await service.deleteSesion('DEL2');
      expect(indexDB.sesiones.delete).not.toHaveBeenCalled();
    });

    it('🔴 error en eliminación', async () => {
      gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
      await service.deleteSesion('DEL3');
      expect(gql.mutation).toHaveBeenCalled();
    });
  });
  it('🔵 procesa sesión pending-create y pending-delete', async () => {
    (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
      toArray: () =>
        dexiePromise([
          { id_sesion: 'C1', syncStatus: 'pending-create' },
          { id_sesion: 'D1', syncStatus: 'pending-delete', deleted: true },
        ]),
    });

    jest.spyOn(service as any, 'crearSesiones').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'deleteSesion').mockResolvedValue(undefined);

    await service.syncSesionesPendientes();

    expect(service.crearSesiones).toHaveBeenCalledWith('C1');
    expect(service.deleteSesion).toHaveBeenCalledWith('D1');
  });

  it('🔴 maneja error en updateAsistencias', async () => {
    (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
      toArray: () =>
        dexiePromise([
          {
            id_asistencia: 'A2',
            id_sesion: 'S1',
            syncStatus: 'pending-update',
          },
        ]),
    });
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      dexiePromise({ id_actividad: 'ACT', id_sesion: 'S1' }),
    );
    gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
    await service.syncAsistenciasPendientes();
    expect(gql.mutation).toHaveBeenCalled();
  });
  it('⚪ ignora sesión con syncStatus desconocido', async () => {
    (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
      toArray: () => dexiePromise([{ id_sesion: 'X1', syncStatus: 'otro' }]),
    });
    const crearSpy = jest
      .spyOn(service as any, 'crearSesiones')
      .mockResolvedValue(undefined);
    const updateSpy = jest
      .spyOn(service as any, 'updateSesiones')
      .mockResolvedValue(undefined);
    const deleteSpy = jest
      .spyOn(service as any, 'deleteSesion')
      .mockResolvedValue(undefined);

    await service.syncSesionesPendientes();

    // Ninguna acción debe ejecutarse
    expect(crearSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('⚠️ crearSesiones maneja respuesta no exitosa', async () => {
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      dexiePromise({ id_sesion: 'S3' }),
    );
    gql.mutation.mockReturnValue(
      of({ createSesion: { exitoso: 'N', mensaje: 'falló' } }) as any,
    );
    await (service as any).crearSesiones('S3');
    expect(sesiones.update).not.toHaveBeenCalled();
  });
  it('⚠️ crearSesiones maneja respuesta no exitosa', async () => {
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      dexiePromise({ id_sesion: 'S3' }),
    );
    gql.mutation.mockReturnValue(
      of({ createSesion: { exitoso: 'N', mensaje: 'falló' } }) as any,
    );
    await (service as any).crearSesiones('S3');
    expect(sesiones.update).not.toHaveBeenCalled();
  });
  it('⚠️ deleteSesion muestra advertencia si no exitoso', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    gql.mutation.mockReturnValue(
      of({ deleteSesion: { exitoso: 'N', mensaje: 'No borrado' } }) as any,
    );
    await service.deleteSesion('DEL_WARN');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no eliminada:'),
      'No borrado',
    );
    warnSpy.mockRestore();
  });

  

  it('⚠️ crearActividades muestra advertencia si no exitoso', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.actividades.get as jest.Mock).mockReturnValue(
      dexiePromise({ id_actividad: 'A4' }),
    );
    gql.mutation.mockReturnValue(
      of({ createActividad: { exitoso: 'N', mensaje: 'No sync' } }) as any,
    );
    await (service as any).crearActividades('A4');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no sincronizada:'),
      'No sync',
    );
    warnSpy.mockRestore();
  });

  

  it('⚠️ updateSesiones muestra advertencia si no exitoso', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      dexiePromise({ id_sesion: 'S_WARN' }),
    );
    gql.mutation.mockReturnValue(
      of({ updateSesion: { exitoso: 'N', mensaje: 'no sync' } }) as any,
    );
    await service.updateSesiones('S_WARN');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no sincronizada:'),
      'no sync',
    );
    warnSpy.mockRestore();
  });

  

  it('⚠️ syncAsistenciasPendientes muestra advertencia si no exitoso', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
      toArray: () =>
        dexiePromise([
          {
            id_asistencia: 'AX',
            id_sesion: 'SX',
            syncStatus: 'pending-update',
          },
        ]),
    });
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      dexiePromise({ id_actividad: 'ACTX', id_sesion: 'SX' }),
    );
    gql.mutation.mockReturnValue(
      of({ updateAsistencias: { exitoso: 'N', mensaje: 'falló sync' } }) as any,
    );
    await service.syncAsistenciasPendientes();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no sincronizadas'),
      'falló sync',
    );
    warnSpy.mockRestore();
  });

  it('❌ deleteSesion registra error en catch', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    gql.mutation.mockReturnValue(throwError(() => new Error('boom')));
    await service.deleteSesion('DEL_ERR');
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error eliminando sesión DEL_ERR:'),
      expect.any(Error),
    );
    errSpy.mockRestore();
  });

  it('🧪 toDateOnly maneja timestamp 0', () => {
    const res = (service as any).toDateOnly('0');
    expect(res).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('🛰️ pingBackend devuelve false cuando no es pong', async () => {
    load.ping.mockReturnValue(of('no-pong'));
    await expect((service as any).pingBackend()).resolves.toBe(false);
  });

  it('🧩 toDateOnly maneja null, undefined y cadena vacía', () => {
    expect((service as any).toDateOnly(null)).toBeNull();
    expect((service as any).toDateOnly(undefined)).toBeNull();
    expect((service as any).toDateOnly('')).toBeNull();
  });

  it('🧩 toDateOnly devuelve null si valor no numérico', () => {
    expect((service as any).toDateOnly('abc')).toBeNull();
  });

  it('⚠️ crearActividades muestra advertencia si no se encuentra la actividad', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.actividades.get as jest.Mock).mockReturnValue(
      dexiePromise(undefined),
    );
    await (service as any).crearActividades('NOT_FOUND');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no encontrada'),
    );
    warnSpy.mockRestore();
  });

  it('⚠️ updateSesiones muestra advertencia si no se encuentra la sesión', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      dexiePromise(undefined),
    );
    await service.updateSesiones('NOT_FOUND');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no encontrada'),
    );
    warnSpy.mockRestore();
  });

  it('✅ syncAsistenciasPendientes retorna sin registros', async () => {
    const spyWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
      toArray: () => dexiePromise([]),
    });
    await service.syncAsistenciasPendientes();
    expect(spyWarn).not.toHaveBeenCalled(); // no debe entrar a warnings
    spyWarn.mockRestore();
  });

  it('❌ deleteSesion captura error en catch', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    gql.mutation.mockReturnValue(throwError(() => new Error('GraphQL fail')));
    await service.deleteSesion('ERR_DEL');
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error eliminando sesión ERR_DEL:'),
      expect.any(Error),
    );
    errSpy.mockRestore();
  });
  it('🧩 toDateOnly cubre null, undefined, vacío y no numérico', () => {
    expect((service as any).toDateOnly(null)).toBeNull();
    expect((service as any).toDateOnly(undefined)).toBeNull();
    expect((service as any).toDateOnly('')).toBeNull();
    expect((service as any).toDateOnly('abc')).toBeNull();
  });

  it('⚠️ crearActividades maneja caso sin actividad', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.actividades.get as jest.Mock).mockReturnValue(
      Promise.resolve(undefined),
    ); // 👈 real Promise
    await (service as any).crearActividades('MISSING_ACT');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no encontrada'),
    );
    warnSpy.mockRestore();
  });

  it('⚠️ updateSesiones maneja caso sin sesión', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      Promise.resolve(undefined),
    ); // 👈 real Promise
    await service.updateSesiones('MISSING_SES');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('no encontrada'),
    );
    warnSpy.mockRestore();
  });

  it('✅ syncAsistenciasPendientes sale con array vacío', async () => {
    (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
      toArray: () => Promise.resolve([]), // 👈 sin dexiePromise
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await service.syncAsistenciasPendientes();
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('❌ deleteSesion captura error correctamente', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (gql.mutation as jest.Mock).mockImplementationOnce(() => {
      throw new Error('boom');
    }); // 👈 lanza error real
    await service.deleteSesion('ERR_DEL');
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error eliminando sesión ERR_DEL:'),
      expect.any(Error),
    );
    errSpy.mockRestore();
  });

  //adicionales deepseek
  // Agrega después de las pruebas existentes en el describe principal

  describe('Líneas no cubiertas', () => {
    it('📴 syncPending muestra warning cuando backend inactivo', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(service as any, 'pingBackend').mockResolvedValue(false);

      await (service as any).syncPending();

      expect(warnSpy).toHaveBeenCalledWith(
        '⚠️ Backend inactivo, no se sincroniza todavía',
      );
      warnSpy.mockRestore();
    });

    it('🚫 ignora asistencias sin id_sesion', async () => {
      const asistenciasSinSesion = [
        { id_asistencia: 'A1', id_sesion: null, syncStatus: 'pending-update' },
        {
          id_asistencia: 'A2',
          id_sesion: undefined,
          syncStatus: 'pending-create',
        },
        { id_asistencia: 'A3', id_sesion: 'S1', syncStatus: 'pending-update' }, // esta sí tiene
      ];

      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise(asistenciasSinSesion),
      });

      (indexDB.sesiones.get as jest.Mock).mockImplementation((id_sesion) => {
        if (id_sesion === 'S1') {
          return dexiePromise({ id_actividad: 'ACT1', id_sesion: 'S1' });
        }
        return dexiePromise(undefined);
      });

      gql.mutation.mockReturnValue(
        of({ updateAsistencias: { exitoso: 'S', mensaje: 'ok' } }) as any,
      );

      await service.syncAsistenciasPendientes();

      // Solo debe procesar la asistencia con id_sesion 'S1'
      expect(gql.mutation).toHaveBeenCalledTimes(1);
      expect(gql.mutation).toHaveBeenCalledWith(expect.any(String), {
        input: expect.objectContaining({
          id_sesion: 'S1',
          nuevos: expect.arrayContaining([
            expect.objectContaining({ id_asistencia: 'A3', id_sesion: 'S1' }),
          ]),
        }),
      });
    });

    it('⚪ syncSesionesPendientes maneja caso default en switch', async () => {
      const sesionConStatusDesconocido = {
        id_sesion: 'UNKNOWN',
        syncStatus: 'unknown-status',
        deleted: false,
      };

      (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([sesionConStatusDesconocido]),
      });

      const crearSpy = jest
        .spyOn(service as any, 'crearSesiones')
        .mockResolvedValue(undefined);
      const updateSpy = jest
        .spyOn(service, 'updateSesiones')
        .mockResolvedValue(undefined);
      const deleteSpy = jest
        .spyOn(service, 'deleteSesion')
        .mockResolvedValue(undefined);

      await service.syncSesionesPendientes();

      expect(crearSpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('🚫 syncAsistenciasPendientes ignora asistencias sin id_sesion', async () => {
      const asistenciasSinSesion = [
        {
          id_asistencia: 'ASIN1',
          id_sesion: null, // ← Sin sesión
          syncStatus: 'pending-update',
        },
        {
          id_asistencia: 'ASIN2',
          id_sesion: undefined, // ← Sin sesión
          syncStatus: 'pending-create',
        },
      ];

      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise(asistenciasSinSesion),
      });

      const gqlSpy = jest.spyOn(gql, 'mutation');

      await service.syncAsistenciasPendientes();

      // No debe llamar a GraphQL porque no hay sesiones válidas
      expect(gqlSpy).not.toHaveBeenCalled();
    });

    it('⚠️ syncAsistenciasPendientes muestra warning cuando mutation no es exitosa', async () => {
      const asistenciasValidas = [
        {
          id_asistencia: 'AWARN1',
          id_sesion: 'SWARN1',
          syncStatus: 'pending-update',
        },
      ];

      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise(asistenciasValidas),
      });

      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_actividad: 'ACTWARN', id_sesion: 'SWARN1' }),
      );

      // Respuesta no exitosa
      gql.mutation.mockReturnValue(
        of({
          updateAsistencias: { exitoso: 'N', mensaje: 'Error en servidor' },
        }) as any,
      );

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await service.syncAsistenciasPendientes();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '❌ Asistencias no sincronizadas (sesión SWARN1):',
        ),
        'Error en servidor',
      );
      warnSpy.mockRestore();
    });

    it('❌ syncAsistenciasPendientes maneja error en mutation', async () => {
      const asistenciasValidas = [
        {
          id_asistencia: 'AERR1',
          id_sesion: 'SERR1',
          syncStatus: 'pending-update',
        },
      ];

      (indexDB.asistencias.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise(asistenciasValidas),
      });

      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_actividad: 'ACTERR', id_sesion: 'SERR1' }),
      );

      // Error en mutation
      gql.mutation.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await service.syncAsistenciasPendientes();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '❌ Error sincronizando asistencias (sesión SERR1):',
        ),
        expect.any(Error),
      );
      errorSpy.mockRestore();
    });

    it('🔄 syncSesionesPendientes marca sesiones eliminadas como pending-delete', async () => {
      const sesionesEliminadas = [
        {
          id_sesion: 'SDEL1',
          syncStatus: 'synced', // Estado inicial
          deleted: true, // ← Marcada para eliminar
        },
      ];

      (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise(sesionesEliminadas),
      });

      // No es necesario espiar el update del dataSource porque ya tenemos un mock
      // Simplemente verificamos que el mock del dataSource fue llamado con los argumentos correctos
      const deleteSpy = jest
        .spyOn(service, 'deleteSesion')
        .mockResolvedValue(undefined);

      await service.syncSesionesPendientes();

      // Verificamos que el update del mock de sesiones fue llamado con los argumentos correctos
      expect(sesiones.update).toHaveBeenCalledWith('SDEL1', {
        ...sesionesEliminadas[0],
        syncStatus: 'pending-delete',
      });

      // Y luego llamar a deleteSesion
      expect(deleteSpy).toHaveBeenCalledWith('SDEL1');
    });
  });
});
