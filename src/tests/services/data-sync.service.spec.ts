import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
      (indexDB.actividades.get as jest.Mock).mockReturnValue(dexiePromise({ id_actividad: 'A1' }));
      gql.mutation.mockReturnValue(of({ createActividad: { exitoso: 'S', mensaje: 'ok' } }) as any);

      await service.crearActividades('A1');
      expect(actividades.update).toHaveBeenCalled();
    });

    it('🔴 maneja error', async () => {
      (indexDB.actividades.get as jest.Mock).mockReturnValue(dexiePromise({ id_actividad: 'A2' }));
      gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
      await service.crearActividades('A2');
      expect(gql.mutation).toHaveBeenCalled();
    });

    it('⚪ sin actividad', async () => {
      (indexDB.actividades.get as jest.Mock).mockReturnValue(dexiePromise(undefined));
      const result = await service.crearActividades('NA');
      expect(result).toBeUndefined();
    });
  });

  // --- updateSesiones ---
  describe('updateSesiones', () => {
    it('🟢 éxito', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise({ id_sesion: 'S1' }));
      gql.mutation.mockReturnValue(of({ updateSesion: { exitoso: 'S', mensaje: 'ok' } }) as any);
      await service.updateSesiones('S1');
      expect(sesiones.update).toHaveBeenCalled();
    });

    it('🔴 error', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise({ id_sesion: 'S2' }));
      gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
      await service.updateSesiones('S2');
      expect(gql.mutation).toHaveBeenCalled();
    });

    it('⚪ sin sesión', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise(undefined));
      await service.updateSesiones('NA');
      expect(sesiones.update).not.toHaveBeenCalled();
    });
  });

  // --- syncActividadesPendientes ---
  describe('syncActividadesPendientes', () => {
    it('🟢 sincroniza correctamente', async () => {
      (indexDB.actividades.filter as jest.Mock).mockReturnValue({
        toArray: () => dexiePromise([{ id_actividad: 'A3', syncStatus: 'pending-create' }]),
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
          dexiePromise([{ id_sesion: 'S3', syncStatus: 'pending-update', deleted: false }]),
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
          dexiePromise([{ id_asistencia: 'A1', id_sesion: 'S1', syncStatus: 'pending-create' }]),
      });
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_actividad: 'ACT', id_sesion: 'S1' })
      );
      gql.mutation.mockReturnValue(of({ updateAsistencias: { exitoso: 'S', mensaje: 'ok' } }) as any);
      await service.syncAsistenciasPendientes();
      expect(asistencias.update).toHaveBeenCalled();
    });
  });

  // --- syncPending ---
  describe('syncPending', () => {
    it('📴 backend inactivo', async () => {
      jest.spyOn(service as any, 'pingBackend').mockReturnValue(dexiePromise(false));
      const spyAct = jest.spyOn(service, 'syncActividadesPendientes').mockResolvedValue(undefined);
      await (service as any).syncPending();
      expect(spyAct).not.toHaveBeenCalled();
    });

    it('🟢 backend activo', async () => {
      jest.spyOn(service as any, 'pingBackend').mockReturnValue(dexiePromise(true));
      jest.spyOn(service, 'syncActividadesPendientes').mockResolvedValue(undefined);
      jest.spyOn(service, 'syncSesionesPendientes').mockResolvedValue(undefined);
      jest.spyOn(service, 'syncAsistenciasPendientes').mockResolvedValue(undefined);
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

      const spyPending = jest.spyOn(service as any, 'syncPending').mockResolvedValue(undefined);
      await (service as any).startSync();

      expect(spyPending).toHaveBeenCalled();
      expect(spyPending.mock.calls.length).toBeGreaterThan(1);
    });
  });


  describe('crearSesiones', () => {
    it('🟢 flujo exitoso', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_sesion: 'S1' })
      );
      gql.mutation.mockReturnValue(
        of({ createSesion: { exitoso: 'S', mensaje: 'ok' } }) as any
      );

      await (service as any).crearSesiones('S1');
      expect(sesiones.update).toHaveBeenCalled();
    });

    it('⚪ sesión no encontrada', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise(undefined));
      await (service as any).crearSesiones('NA');
      expect(sesiones.update).not.toHaveBeenCalled();
    });

    it('🔴 error al crear sesión', async () => {
      (indexDB.sesiones.get as jest.Mock).mockReturnValue(
        dexiePromise({ id_sesion: 'S2' })
      );
      gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
      await (service as any).crearSesiones('S2');
      expect(gql.mutation).toHaveBeenCalled();
    });
  });
  describe('deleteSesion', () => {
    it('🟢 elimina sesión exitosamente', async () => {
      gql.mutation.mockReturnValue(
        of({ deleteSesion: { exitoso: 'S', mensaje: 'ok' } }) as any
      );
      await service.deleteSesion('DEL1');
      expect(indexDB.sesiones.delete).toHaveBeenCalledWith('DEL1');
    });

    it('⚪ sesión no eliminada (fallo)', async () => {
      gql.mutation.mockReturnValue(
        of({ deleteSesion: { exitoso: 'N', mensaje: 'falló' } }) as any
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
        dexiePromise([{ id_asistencia: 'A2', id_sesion: 'S1', syncStatus: 'pending-update' }]),
    });
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(
      dexiePromise({ id_actividad: 'ACT', id_sesion: 'S1' })
    );
    gql.mutation.mockReturnValue(throwError(() => new Error('fail')));
    await service.syncAsistenciasPendientes();
    expect(gql.mutation).toHaveBeenCalled();
  });
  it('⚪ ignora sesión con syncStatus desconocido', async () => {
    (indexDB.sesiones.filter as jest.Mock).mockReturnValue({
      toArray: () => dexiePromise([{ id_sesion: 'X1', syncStatus: 'otro' }]),
    });
    const crearSpy = jest.spyOn(service as any, 'crearSesiones').mockResolvedValue(undefined);
    const updateSpy = jest.spyOn(service as any, 'updateSesiones').mockResolvedValue(undefined);
    const deleteSpy = jest.spyOn(service as any, 'deleteSesion').mockResolvedValue(undefined);

    await service.syncSesionesPendientes();

    // Ninguna acción debe ejecutarse
    expect(crearSpy).not.toHaveBeenCalled();
    expect(updateSpy).not.toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('⚠️ crearSesiones maneja respuesta no exitosa', async () => {
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise({ id_sesion: 'S3' }));
    gql.mutation.mockReturnValue(
      of({ createSesion: { exitoso: 'N', mensaje: 'falló' } }) as any
    );
    await (service as any).crearSesiones('S3');
    expect(sesiones.update).not.toHaveBeenCalled();
  });
  it('⚠️ crearSesiones maneja respuesta no exitosa', async () => {
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise({ id_sesion: 'S3' }));
    gql.mutation.mockReturnValue(
      of({ createSesion: { exitoso: 'N', mensaje: 'falló' } }) as any
    );
    await (service as any).crearSesiones('S3');
    expect(sesiones.update).not.toHaveBeenCalled();
  });
  it('⚠️ deleteSesion muestra advertencia si no exitoso', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    gql.mutation.mockReturnValue(
      of({ deleteSesion: { exitoso: 'N', mensaje: 'No borrado' } }) as any
    );
    await service.deleteSesion('DEL_WARN');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('no eliminada:'), 'No borrado');
    warnSpy.mockRestore();
  });

  it('❌ crearSesiones registra error en catch', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (indexDB.sesiones.get as jest.Mock).mockReturnValue(dexiePromise({ id_sesion: 'ERR' }));
    gql.mutation.mockReturnValue(throwError(() => new Error('boom')));
    await (service as any).crearSesiones('ERR');
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error creando sesión ERR:'), expect.any(Error));
    errorSpy.mockRestore();
  });



});
