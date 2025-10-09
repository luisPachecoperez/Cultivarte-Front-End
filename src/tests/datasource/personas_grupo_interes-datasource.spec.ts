import { TestBed } from '@angular/core/testing';
import { Personas_grupo_interesDataSource } from '../../app/indexdb/datasources/personas_grupo_interes-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { Personas_grupo_interesDB } from '../../app/indexdb/interfaces/personas_grupo_interes.interface';

// 🔹 Helper compatible con Dexie
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('Personas_grupo_interesDataSource', () => {
  let service: Personas_grupo_interesDataSource;

  const mockRegistro: Personas_grupo_interesDB = {
    id_personas_grupo_interes: 'PGI1',
    id_persona: 'U1',
    id_grupo_interes: 'GI1',
    id_creado_por: 'ADM1',
    fecha_creacion: new Date(),
    id_modificado_por: 'ADM2',
    fecha_modificacion: new Date(),
    syncStatus: 'synced',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Personas_grupo_interesDataSource],
    });
    service = TestBed.inject(Personas_grupo_interesDataSource);

    (indexDB as any).personas_grupo_interes = {
      toArray: jest.fn('toArray').and.returnValue(dexiePromise([mockRegistro])),
      get: jest.fn('get').and.returnValue(dexiePromise(mockRegistro)),
      add: jest.fn('add').and.returnValue(dexiePromise('PGI1')),
      update: jest.fn('update').and.returnValue(dexiePromise(1)),
      delete: jest.fn('delete').and.returnValue(dexiePromise(undefined)),
      bulkAdd: jest.fn('bulkAdd').and.returnValue(dexiePromise(undefined)),
      clear: jest.fn('clear').and.returnValue(dexiePromise(undefined)),
    };
  });

  afterEach(() => TestBed.resetTestingModule());

  // --- getAll ---
  it('🟢 getAll debe retornar todos los registros', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].id_personas_grupo_interes).toBe('PGI1');
    expect(indexDB.personas_grupo_interes.toArray).toHaveBeenCalled();
  });

  // --- getById ---
  it('🟢 getById debe retornar un registro por id', async () => {
    const result = await service.getById('PGI1');
    expect(result?.id_persona).toBe('U1');
    expect((indexDB.personas_grupo_interes.get as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe crear un registro correctamente', async () => {
      const result = await service.create(mockRegistro);
      expect(result).toBe('PGI1');
      expect(indexDB.personas_grupo_interes.add).toHaveBeenCalled();
    });

    it('debe manejar error en add()', async () => {
      (indexDB.personas_grupo_interes.add as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
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
      const result = await service.update('PGI1', { id_grupo_interes: 'GI2' });
      expect(result).toBe(1);
      expect(indexDB.personas_grupo_interes.update).toHaveBeenCalled();
    });

    it('debe manejar error en update()', async () => {
      (indexDB.personas_grupo_interes.update as jasmine.Spy).and.returnValue(Promise.reject('update error'));
      try {
        await service.update('PGI1', {});
        fail('Debe lanzar error');
      } catch (err) {
        expect(err).toBe('update error');
      }
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar correctamente', async () => {
      await service.delete('PGI1');
      expect(indexDB.personas_grupo_interes.delete).toHaveBeenCalled();
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.personas_grupo_interes.delete as jasmine.Spy).and.returnValue(Promise.reject('delete error'));
      try {
        await service.delete('PGI1');
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
      expect(indexDB.personas_grupo_interes.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.personas_grupo_interes.bulkAdd as jasmine.Spy).calls.argsFor(0)[0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.personas_grupo_interes.bulkAdd as jasmine.Spy).and.returnValue(Promise.reject('bulk error'));
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
    expect(indexDB.personas_grupo_interes.clear).toHaveBeenCalled();
  });
});
