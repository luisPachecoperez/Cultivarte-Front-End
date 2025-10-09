import { TestBed } from '@angular/core/testing';
import { Personas_programasDataSource } from '../../app/indexdb/datasources/personas_programas-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { Personas_programasDB } from '../../app/indexdb/interfaces/personas_programas.interface';

// 🔹 Helper tipo Dexie
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('Personas_programasDataSource', () => {
  let service: Personas_programasDataSource;

  const mockRegistro: Personas_programasDB = {
    id_persona_programa: 'PP1',
    id_persona: 'U1',
    id_programa: 'PR1',
    id_creado_por: 'ADM',
    fecha_creacion: new Date(),
    id_modificado_por: 'ADM2',
    fecha_modificacion: new Date(),
    syncStatus: 'synced',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Personas_programasDataSource],
    });
    service = TestBed.inject(Personas_programasDataSource);

    (indexDB as any).personas_programas = {
      toArray: jasmine.createSpy('toArray').and.returnValue(dexiePromise([mockRegistro])),
      get: jasmine.createSpy('get').and.returnValue(dexiePromise(mockRegistro)),
      add: jasmine.createSpy('add').and.returnValue(dexiePromise('PP1')),
      update: jasmine.createSpy('update').and.returnValue(dexiePromise(1)),
      delete: jasmine.createSpy('delete').and.returnValue(dexiePromise(undefined)),
      bulkAdd: jasmine.createSpy('bulkAdd').and.returnValue(dexiePromise(undefined)),
      clear: jasmine.createSpy('clear').and.returnValue(dexiePromise(undefined)),
    };
  });

  afterEach(() => TestBed.resetTestingModule());

  // --- getAll ---
  it('🟢 getAll debe retornar todos los registros', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].id_persona_programa).toBe('PP1');
    expect(indexDB.personas_programas.toArray).toHaveBeenCalled();
  });

  // --- getById ---
  it('🟢 getById debe retornar un registro por id', async () => {
    const result = await service.getById('PP1');
    expect(result?.id_persona).toBe('U1');
    // 👇 evitamos error de TS2554
    expect((indexDB.personas_programas.get as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe crear un registro correctamente', async () => {
      const result = await service.create(mockRegistro);
      expect(result).toBe('PP1');
      expect(indexDB.personas_programas.add).toHaveBeenCalled();
    });

    it('debe manejar error en add()', async () => {
      (indexDB.personas_programas.add as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
      try {
        await service.create(mockRegistro);
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('DB error');
      }
    });
  });

  // --- update ---
  describe('🟢 update', () => {
    it('debe actualizar correctamente', async () => {
      const result = await service.update('PP1', { id_programa: 'PR2' });
      expect(result).toBe(1);
      expect(indexDB.personas_programas.update).toHaveBeenCalled();
    });

    it('debe manejar error en update()', async () => {
      (indexDB.personas_programas.update as jasmine.Spy).and.returnValue(Promise.reject('update error'));
      try {
        await service.update('PP1', {});
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('update error');
      }
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar correctamente', async () => {
      await service.delete('PP1');
      expect(indexDB.personas_programas.delete).toHaveBeenCalled();
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.personas_programas.delete as jasmine.Spy).and.returnValue(Promise.reject('delete error'));
      try {
        await service.delete('PP1');
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('delete error');
      }
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe agregar registros con syncStatus por defecto', async () => {
      const data = [{ ...mockRegistro, syncStatus: null as any }];
      await service.bulkAdd(data);
      expect(indexDB.personas_programas.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.personas_programas.bulkAdd as jasmine.Spy).calls.argsFor(0)[0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.personas_programas.bulkAdd as jasmine.Spy).and.returnValue(Promise.reject('bulk error'));
      try {
        await service.bulkAdd([mockRegistro]);
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('bulk error');
      }
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar toda la tabla', async () => {
    await service.deleteFull();
    expect(indexDB.personas_programas.clear).toHaveBeenCalled();
  });
});
