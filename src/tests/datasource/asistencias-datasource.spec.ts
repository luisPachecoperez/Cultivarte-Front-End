// ✅ src/tests/datasource/asistencias-datasource.spec.ts
import { TestBed } from '@angular/core/testing';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { AsistenciasDB } from '../../app/indexdb/interfaces/asistencias.interface';

// Helper Dexie Promise compatible (simula PromiseExtended<T>)
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('AsistenciasDataSource', () => {
  let service: AsistenciasDataSource;

  const mockAsistencia: AsistenciasDB = {
    id_asistencia: 'A1',
    id_actividad: 'ACT1',
    id_sesion: 'S1',
    id_persona: 'P1',
    syncStatus: 'synced',
    deleted: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsistenciasDataSource],
    });

    service = TestBed.inject(AsistenciasDataSource);

    // Mock completo (todos los métodos espías disponibles por defecto)
    (indexDB as any).asistencias = {
      toArray: jest.fn('toArray').and.returnValue(dexiePromise([mockAsistencia])),
      get: jest.fn('get').and.returnValue(dexiePromise(mockAsistencia)),
      add: jest.fn('add').and.returnValue(dexiePromise('A1')),
      update: jest.fn('update').and.returnValue(dexiePromise(1)),
      delete: jest.fn('delete').and.returnValue(dexiePromise(undefined)),
      bulkAdd: jest.fn('bulkAdd').and.returnValue(dexiePromise(undefined)),
      clear: jest.fn('clear').and.returnValue(dexiePromise(undefined)),
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ---------------- getAll ----------------
  it('debe retornar todas las asistencias (default: 1 elemento)', async () => {
    const result = await service.getAll();
    expect(indexDB.asistencias.toArray).toHaveBeenCalledTimes(1);
    expect(result.length).toBe(1);
    expect(result[0].id_asistencia).toBe('A1');
  });

  it('debe retornar arreglo vacío cuando no hay registros', async () => {
    (indexDB.asistencias.toArray as jasmine.Spy).and.returnValue(dexiePromise([]));
    const result = await service.getAll();
    expect(result).toEqual([]);
  });

  // ---------------- getById ----------------
  it('debe retornar una asistencia por id', async () => {
    const result = await service.getById('A1');
    const getArgs = (indexDB.asistencias.get as jasmine.Spy).calls.mostRecent().args;
    expect(getArgs[0]).toBe('A1');
    expect(result?.id_persona).toBe('P1');
  });

  it('debe retornar undefined si no existe el id', async () => {
    (indexDB.asistencias.get as jasmine.Spy).and.returnValue(dexiePromise(undefined));
    const result = await service.getById('NOEXISTE');
    const getArgs = (indexDB.asistencias.get as jasmine.Spy).calls.mostRecent().args;
    expect(getArgs[0]).toBe('NOEXISTE');
    expect(result).toBeUndefined();
  });

  // ---------------- create ----------------
  describe('create', () => {
    it('debe crear una asistencia correctamente y retornar GraphQLResponse (S)', async () => {
      const result = await service.create(mockAsistencia);
      expect(indexDB.asistencias.add).toHaveBeenCalledTimes(1);
      const addArgs = (indexDB.asistencias.add as jasmine.Spy).calls.mostRecent().args;
      expect(addArgs[0]).toEqual(mockAsistencia);
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toBe('Registro adicionado');
    });

    it('debe propagar el error cuando add() rechaza', async () => {
      (indexDB.asistencias.add as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
      await expectAsync(service.create(mockAsistencia)).toBeRejectedWith('DB error');
      const addArgs = (indexDB.asistencias.add as jasmine.Spy).calls.mostRecent().args;
      expect(addArgs[0]).toEqual(mockAsistencia);
    });
  });

  // ---------------- update ----------------
  describe('update', () => {
    it('debe actualizar y retornar GraphQLResponse (S) con mensaje correcto', async () => {
      const result = await service.update('A1', { id_persona: 'P2' });
      expect(indexDB.asistencias.update).toHaveBeenCalledTimes(1);
      const updArgs = (indexDB.asistencias.update as jasmine.Spy).calls.mostRecent().args;
      expect(updArgs[0]).toBe('A1');
      expect(updArgs[1]).toEqual({ id_persona: 'P2' });
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toBe('Registro actualizado');
    });

    it('debe propagar el error cuando update() rechaza', async () => {
      (indexDB.asistencias.update as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
      await expectAsync(service.update('A1', {})).toBeRejectedWith('DB error');
      const updArgs = (indexDB.asistencias.update as jasmine.Spy).calls.mostRecent().args;
      expect(updArgs[0]).toBe('A1');
      expect(updArgs[1]).toEqual({});
    });
  });

  // ---------------- delete ----------------
  describe('delete', () => {
    it('debe realizar soft delete cuando soft=true (update) y no llamar delete', async () => {
      const result = await service.delete('A1', true);
      expect(indexDB.asistencias.update).toHaveBeenCalledTimes(1);
      const updArgs = (indexDB.asistencias.update as jasmine.Spy).calls.mostRecent().args;
      expect(updArgs[0]).toBe('A1');
      expect(updArgs[1]).toEqual({ deleted: true });
      expect((indexDB.asistencias.delete as jasmine.Spy).calls.count()).toBe(0);
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toBe('Registro actualizado');
    });

    it('debe realizar hard delete cuando soft=false (delete) y no llamar update', async () => {
      const result = await service.delete('A1', false);
      expect(indexDB.asistencias.delete).toHaveBeenCalledTimes(1);
      const delArgs = (indexDB.asistencias.delete as jasmine.Spy).calls.mostRecent().args;
      expect(delArgs[0]).toBe('A1');
      expect((indexDB.asistencias.update as jasmine.Spy).calls.count()).toBe(0);
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toBe('Registro actualizado');
    });

    it('debe propagar el error si update() rechaza en soft delete', async () => {
      (indexDB.asistencias.update as jasmine.Spy).and.returnValue(Promise.reject('upd-error'));
      await expectAsync(service.delete('A1', true)).toBeRejectedWith('upd-error');
      const updArgs = (indexDB.asistencias.update as jasmine.Spy).calls.mostRecent().args;
      expect(updArgs[0]).toBe('A1');
      expect(updArgs[1]).toEqual({ deleted: true });
      expect((indexDB.asistencias.delete as jasmine.Spy).calls.count()).toBe(0);
    });

    it('debe propagar el error si delete() rechaza en hard delete', async () => {
      (indexDB.asistencias.delete as jasmine.Spy).and.returnValue(Promise.reject('del-error'));
      await expectAsync(service.delete('A1', false)).toBeRejectedWith('del-error');
      const delArgs = (indexDB.asistencias.delete as jasmine.Spy).calls.mostRecent().args;
      expect(delArgs[0]).toBe('A1');
      expect((indexDB.asistencias.update as jasmine.Spy).calls.count()).toBe(0);
    });
  });

  // ---------------- bulkAdd ----------------
  describe('bulkAdd', () => {
    it('debe establecer syncStatus="synced" cuando viene null/undefined', async () => {
      const data: AsistenciasDB[] = [
        { ...mockAsistencia, id_asistencia: 'A2', syncStatus: null as any },
        { ...mockAsistencia, id_asistencia: 'A3', syncStatus: undefined as any },
      ];
      await service.bulkAdd(data);

      expect(indexDB.asistencias.bulkAdd).toHaveBeenCalledTimes(1);
      const passed = (indexDB.asistencias.bulkAdd as jasmine.Spy).calls.argsFor(0)[0] as AsistenciasDB[];
      expect(passed.length).toBe(2);
      expect(passed[0].syncStatus).toBe('synced');
      expect(passed[1].syncStatus).toBe('synced');
    });

    it('debe conservar syncStatus existente (no sobreescribir)', async () => {
      const data: AsistenciasDB[] = [
        { ...mockAsistencia, id_asistencia: 'A4', syncStatus: 'pending-create' as any },
        { ...mockAsistencia, id_asistencia: 'A5', syncStatus: 'synced' as any },
      ];
      await service.bulkAdd(data);

      const passed = (indexDB.asistencias.bulkAdd as jasmine.Spy).calls.argsFor(0)[0] as AsistenciasDB[];
      const a4 = passed.find(a => a.id_asistencia === 'A4')!;
      const a5 = passed.find(a => a.id_asistencia === 'A5')!;
      expect(a4.syncStatus).toBe('pending-create');
      expect(a5.syncStatus).toBe('synced');
    });

    it('debe propagar error si bulkAdd() rechaza', async () => {
      (indexDB.asistencias.bulkAdd as jasmine.Spy).and.returnValue(Promise.reject('bulk-error'));
      await expectAsync(service.bulkAdd([mockAsistencia])).toBeRejectedWith('bulk-error');
    });
  });

  // ---------------- deleteFull ----------------
  it('debe limpiar toda la tabla (clear)', async () => {
    await service.deleteFull();
    expect(indexDB.asistencias.clear).toHaveBeenCalledTimes(1);
  });
});
