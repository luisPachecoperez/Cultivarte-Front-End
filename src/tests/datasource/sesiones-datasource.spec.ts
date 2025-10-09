import { TestBed } from '@angular/core/testing';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { SesionesDB } from '../../app/indexdb/interfaces/sesiones.interface';
import { GraphQLResponse } from '../../app/shared/interfaces/graphql-response.interface';

// 🔹 Helper Dexie compatible
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('SesionesDataSource', () => {
  let service: SesionesDataSource;

  const mockSesion: SesionesDB = {
    id_sesion: 'S1',
    id_actividad: 'A1',
    fecha_actividad: '2025-10-07',
    hora_inicio: '08:00',
    hora_fin: '10:00',
    nombre_actividad: 'Prueba Sesión',
    syncStatus: 'synced',
    deleted: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SesionesDataSource],
    });
    service = TestBed.inject(SesionesDataSource);

    (indexDB as any).sesiones = {
      toArray: jasmine.createSpy('toArray').and.returnValue(dexiePromise([mockSesion])),
      get: jasmine.createSpy('get').and.returnValue(dexiePromise(mockSesion)),
      add: jasmine.createSpy('add').and.returnValue(dexiePromise(undefined)),
      update: jasmine.createSpy('update').and.returnValue(dexiePromise(undefined)),
      delete: jasmine.createSpy('delete').and.returnValue(dexiePromise(undefined)),
      bulkAdd: jasmine.createSpy('bulkAdd').and.returnValue(dexiePromise(undefined)),
      clear: jasmine.createSpy('clear').and.returnValue(dexiePromise(undefined)),
      where: jasmine.createSpy('where').and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          toArray: jasmine.createSpy('toArray').and.returnValue(dexiePromise([mockSesion])),
        }),
      }),
    };
  });

  afterEach(() => TestBed.resetTestingModule());

  // --- getAll ---
  it('🟢 getAll debe retornar todas las sesiones', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].id_sesion).toBe('S1');
    expect(indexDB.sesiones.toArray).toHaveBeenCalled();
  });

  // --- getById ---
  it('🟢 getById debe retornar una sesión por id', async () => {
    const result = await service.getById('S1');
    expect(result?.id_actividad).toBe('A1');
    expect((indexDB.sesiones.get as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe crear una sesión correctamente y convertir fechas string a timestamp', async () => {
      const sesion: SesionesDB = {
        ...mockSesion,
        fecha_actividad: '2025-10-07',
        fecha_creacion: '2025-10-07',
        fecha_modificacion: '2025-10-07',
      };
      const result: GraphQLResponse = await service.create(sesion);
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toContain('adicionado');
      expect(indexDB.sesiones.add).toHaveBeenCalled();
      const calledWith = (indexDB.sesiones.add as jasmine.Spy).calls.argsFor(0)[0];
      expect(typeof calledWith.fecha_actividad).toBe('string');
      expect(calledWith.fecha_actividad?.includes('-')).toBeFalse();
    });

    it('debe manejar error en add()', async () => {
      (indexDB.sesiones.add as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
      try {
        await service.create(mockSesion);
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('DB error');
      }
    });
  });

  // --- update ---
  describe('🟢 update', () => {
    it('debe actualizar correctamente cuando el registro existe', async () => {
      const result = await service.update('S1', { fecha_actividad: '2025-10-07' });
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toContain('actualizado');
      expect(indexDB.sesiones.update).toHaveBeenCalled();
    });

    it('debe retornar mensaje si no encuentra la sesión', async () => {
      (indexDB.sesiones.get as jasmine.Spy).and.returnValue(dexiePromise(undefined));
      const result = await service.update('NO_EXISTE', { hora_inicio: '09:00' });
      expect(result.exitoso).toBe('N');
      expect(result.mensaje).toContain('No se encontró sesión');
    });

    it('debe mantener syncStatus= pending-create si estaba así', async () => {
      (indexDB.sesiones.get as jasmine.Spy).and.returnValue(
        dexiePromise({ ...mockSesion, syncStatus: 'pending-create' })
      );
      await service.update('S1', { nombre_actividad: 'Modificada' });
      const args = (indexDB.sesiones.update as jasmine.Spy).calls.mostRecent().args[1];
      expect(args.syncStatus).toBe('pending-create');
    });

    it('debe pasar a pending-update si estaba synced', async () => {
      (indexDB.sesiones.get as jasmine.Spy).and.returnValue(
        dexiePromise({ ...mockSesion, syncStatus: 'synced' })
      );
      await service.update('S1', { nombre_actividad: 'Modificada' });
      const args = (indexDB.sesiones.update as jasmine.Spy).calls.mostRecent().args[1];
      expect(args.syncStatus).toBe('pending-update');
    });

    it('debe manejar error en update()', async () => {
      (indexDB.sesiones.update as jasmine.Spy).and.returnValue(Promise.reject('update error'));
      try {
        await service.update('S1', {});
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('update error');
      }
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe marcar como eliminado si soft=true', async () => {
      await service.delete('S1', true);
      expect(indexDB.sesiones.update).toHaveBeenCalledWith('S1', { deleted: true });
    });

    it('debe eliminar físicamente si soft=false', async () => {
      await service.delete('S1', false);
      expect(indexDB.sesiones.delete).toHaveBeenCalled();
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.sesiones.delete as jasmine.Spy).and.returnValue(Promise.reject('delete error'));
      try {
        await service.delete('S1', false);
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('delete error');
      }
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe agregar sesiones con syncStatus por defecto', async () => {
      const data = [{ ...mockSesion, syncStatus: null as any }];
      await service.bulkAdd(data);
      expect(indexDB.sesiones.bulkAdd).toHaveBeenCalled();
      const arg = (indexDB.sesiones.bulkAdd as jasmine.Spy).calls.argsFor(0)[0];
      expect(arg[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.sesiones.bulkAdd as jasmine.Spy).and.returnValue(Promise.reject('bulk error'));
      try {
        await service.bulkAdd([mockSesion]);
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('bulk error');
      }
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar todas las sesiones', async () => {
    await service.deleteFull();
    expect(indexDB.sesiones.clear).toHaveBeenCalled();
  });

  // --- sesionesPorActividad ---
  describe('🟢 sesionesPorActividad', () => {
    it('debe retornar sesiones filtradas por id_actividad', async () => {
      const result = await service.sesionesPorActividad('A1');
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id_actividad).toBe('A1');
      expect(indexDB.sesiones.where).toHaveBeenCalled();
    });

    it('debe manejar error en sesionesPorActividad()', async () => {
      (indexDB.sesiones.where as jasmine.Spy).and.returnValue({
        equals: jasmine.createSpy('equals').and.returnValue({
          toArray: jasmine.createSpy('toArray').and.returnValue(Promise.reject('error')),
        }),
      });
      try {
        await service.sesionesPorActividad('A1');
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('error');
      }
    });
  });
});
