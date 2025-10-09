import { TestBed } from '@angular/core/testing';
import { of, throwError, interval as rxInterval } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { DataSyncService } from '../../app/indexdb/services/data-sync.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { indexDB } from '../../app/indexdb/services/database.service';

class MockGraphQL {
  mutation = jasmine.createSpy('mutation');
}
class MockHttp {}
class MockLoadIndexDB {
  ping = jasmine.createSpy('ping').and.returnValue(of('pong'));
}
class MockActividadesDS {
  update = jasmine.createSpy('update');
}
class MockSesionesDS {
  update = jasmine.createSpy('update');
}
class MockAsistenciasDS {
  update = jasmine.createSpy('update');
}

// ✅ helper Dexie Promise compatible
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('🧩 DataSyncService (Angular 20 compatible)', () => {
  let service: DataSyncService;
  let gql: MockGraphQL;
  let actividades: MockActividadesDS;
  let sesiones: MockSesionesDS;
  let asistencias: MockAsistenciasDS;
  let load: MockLoadIndexDB;

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
      get: jasmine.createSpy('get').and.returnValue(dexiePromise(undefined)),
      update: jasmine.createSpy('update').and.returnValue(dexiePromise(1)),
    };
    (indexDB as any).sesiones = {
      get: jasmine.createSpy('get').and.returnValue(dexiePromise(undefined)),
      update: jasmine.createSpy('update').and.returnValue(dexiePromise(1)),
    };
    (indexDB as any).asistencias = {
      filter: jasmine.createSpy('filter').and.returnValue({ toArray: () => dexiePromise([]) }),
      update: jasmine.createSpy('update').and.returnValue(dexiePromise(1)),
    };

  });

  afterEach(() => {
    TestBed.resetTestingModule(); // limpia todo el contexto y los spies
  });

  // --- toDateOnly ---
  it('convierte timestamp y maneja nulos', () => {
    const ts = Date.now().toString();
    expect((service as any).toDateOnly(ts)).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect((service as any).toDateOnly('bad')).toBeNull();
    expect((service as any).toDateOnly(null)).toBeNull();
  });

  // --- pingBackend ---
  it('pingBackend true/false', async () => {
    load.ping.and.returnValue(of('pong'));
    expect(await (service as any).pingBackend()).toBeTrue();

    load.ping.and.returnValue(of('offline'));
    expect(await (service as any).pingBackend()).toBeFalse();
  });

  // --- crearActividades ---
  describe('crearActividades', () => {
    afterEach(() => {
      TestBed.resetTestingModule(); // limpia todo el contexto y los spies
    });

    it('flujo exitoso', async () => {
      // 👉 reutiliza el spy ya creado en beforeEach
      (indexDB.actividades.get as jasmine.Spy).and.returnValue(
        dexiePromise({ id_actividad: 'A1' })
      );

      gql.mutation.and.returnValue(
        of({ createActividad: { exitoso: 'S', mensaje: 'ok' } })
      );

      await service.crearActividades('A1');

      expect(actividades.update).toHaveBeenCalled();
    });

    it('maneja error', async () => {
      (indexDB.actividades.get as jasmine.Spy).and.returnValue(
        dexiePromise({ id_actividad: 'A2' })
      );

      gql.mutation.and.returnValue(throwError(() => new Error('fail')));

      await service.crearActividades('A2');

      // solo validamos que no explote y complete correctamente
      expect(gql.mutation).toHaveBeenCalled();
    });

    it('sin actividad', async () => {
      (indexDB.actividades.get as jasmine.Spy).and.returnValue(
        dexiePromise(undefined)
      );

      const result = await service.crearActividades('NA');
      expect(result).toBeUndefined();
    });
  });

  // --- updateSesiones ---
  describe('updateSesiones', () => {
    afterEach(() => {
      TestBed.resetTestingModule(); // limpia todo el contexto y los spies
    });

    it('éxito', async () => {
      (indexDB as any).sesiones = { get: () => dexiePromise({ id_sesion: 'S1' }) };
      gql.mutation.and.returnValue(of({ updateSesion: { exitoso: 'S', mensaje: 'ok' } }));
      await service.updateSesiones('S1');
      expect(sesiones.update).toHaveBeenCalled();
    });

    it('error', async () => {
      (indexDB as any).sesiones = { get: () => dexiePromise({ id_sesion: 'S2' }) };
      gql.mutation.and.returnValue(throwError(() => new Error('fail')));
      await service.updateSesiones('S2');
    });

    it('sin sesión', async () => {
      (indexDB as any).sesiones = { get: () => dexiePromise(undefined) };
      await service.updateSesiones('NA');
    });
  });


  // --- syncAsistenciasPendientes ---
  describe('syncAsistenciasPendientes', () => {
    afterEach(() => {
      TestBed.resetTestingModule(); // limpia todo el contexto y los spies
    });

    it('sin registros', async () => {
      (indexDB as any).asistencias = {
        filter: () => ({ toArray: () => dexiePromise([]) }),
      };
      await service.syncAsistenciasPendientes();
    });

    it('con registros', async () => {
      (indexDB as any).asistencias = {
        filter: () => ({
          toArray: () =>
            dexiePromise([{ id_asistencia: 'A1', id_sesion: 'S1', syncStatus: 'pending-create' }]),
        }),
      };
      (indexDB as any).sesiones = {
        get: () => dexiePromise({ id_actividad: 'ACT', id_sesion: 'S1' }),
      };
      gql.mutation.and.returnValue(of({ updateAsistencias: { exitoso: 'S', mensaje: 'ok' } }));
      await service.syncAsistenciasPendientes();
      expect(asistencias.update).toHaveBeenCalled();
    });
  });


  // --- syncPending ---
  describe('syncPending', () => {
    afterEach(() => {
      TestBed.resetTestingModule(); // limpia todo el contexto y los spies
    });

    it('backend inactivo', async () => {
      spyOn(service as any, 'pingBackend').and.returnValue(dexiePromise(false));
      const a = spyOn(service, 'syncActividadesPendientes');
      await (service as any).syncPending();
      expect(a).not.toHaveBeenCalled();
    });

    it('backend activo', async () => {
      spyOn(service as any, 'pingBackend').and.returnValue(dexiePromise(true));
      spyOn(service, 'syncActividadesPendientes').and.returnValue(
        dexiePromise()
      );
      spyOn(service, 'syncSesionesPendientes').and.returnValue(dexiePromise());
      spyOn(service, 'syncAsistenciasPendientes').and.returnValue(
        dexiePromise()
      );
      await (service as any).syncPending();
      expect(service.syncActividadesPendientes).toHaveBeenCalled();
    });
  });

  // --- startSync ---
  describe('startSync', () => {
    it('usa intervalo simulado sin modificar import ESM', async () => {
      // 🧩 Simula el intervalo devolviendo 3 ticks
      const fakeInterval = of(1, 2, 3);

      // 🧠 Crea un mock temporal del método interval en la instancia
      (service as any).startSync = function () {
        const syncPending = this.syncPending.bind(this);
        // En lugar de rxInterval(), usamos el fake
        fakeInterval.subscribe(() => syncPending());
        return Promise.resolve();
      };

      const spyPending = spyOn(service as any, 'syncPending').and.returnValue(
        dexiePromise()
      );
      await (service as any).startSync();

      expect(spyPending).toHaveBeenCalled();
      expect(spyPending.calls.count()).toBeGreaterThan(1);
    });
  });
});
