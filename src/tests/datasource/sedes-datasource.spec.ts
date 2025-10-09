import { TestBed } from '@angular/core/testing';
import { SedesDataSource } from '../../app/indexdb/datasources/sedes-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { SedesDB } from '../../app/indexdb/interfaces/sedes.interface';

// 🔹 Helper para simular Promesas de Dexie
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('SedesDataSource', () => {
  let service: SedesDataSource;
  const mockSede: SedesDB = {
    id_sede: 'S1',
    nombre: 'Cultivarte Central',
    id_creado_por: 'USR1',
    fecha_creacion: '2025-01-01',
    id_modificado_por: 'USR2',
    fecha_modificacion: '2025-01-02',
    syncStatus: 'synced',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SedesDataSource],
    });
    service = TestBed.inject(SedesDataSource);

    (indexDB as any).sedes = {
      toArray: jasmine.createSpy('toArray').and.returnValue(dexiePromise([mockSede])),
      get: jasmine.createSpy('get').and.returnValue(dexiePromise(mockSede)),
      add: jasmine.createSpy('add').and.returnValue(dexiePromise('S1')),
      update: jasmine.createSpy('update').and.returnValue(dexiePromise(1)),
      delete: jasmine.createSpy('delete').and.returnValue(dexiePromise(undefined)),
      bulkAdd: jasmine.createSpy('bulkAdd').and.returnValue(dexiePromise(undefined)),
      clear: jasmine.createSpy('clear').and.returnValue(dexiePromise(undefined)),
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // --- getAll ---
  it('🟢 getAll debe retornar todas las sedes', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].nombre).toBe('Cultivarte Central');
    expect(indexDB.sedes.toArray).toHaveBeenCalled();
  });

  // --- getById ---
  it('🟢 getById debe retornar una sede específica', async () => {
    const result = await service.getById('S1');
    expect(result?.id_sede).toBe('S1');
    expect(indexDB.sedes.get).toHaveBeenCalled();
    expect((indexDB.sedes.get as jasmine.Spy).calls.argsFor(0)[0]).toBe('S1');
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe agregar una nueva sede', async () => {
      const result = await service.create(mockSede);
      expect(result).toBe('S1');
      expect(indexDB.sedes.add).toHaveBeenCalledWith(mockSede);
    });

    it('debe manejar error en add()', async () => {
      (indexDB.sedes.add as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
      await expectAsync(service.create(mockSede)).toBeRejectedWith('DB error');
    });
  });

  // --- update ---
  describe('🟢 update', () => {
    it('debe actualizar correctamente', async () => {
      const result = await service.update('S1', { nombre: 'Nueva Sede' });
      expect(result).toBe(1);
      expect(indexDB.sedes.update).toHaveBeenCalledWith('S1', { nombre: 'Nueva Sede' });
    });

    it('debe manejar error en update()', async () => {
      (indexDB.sedes.update as jasmine.Spy).and.returnValue(Promise.reject('update error'));
      await expectAsync(service.update('S1', {})).toBeRejectedWith('update error');
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar una sede', async () => {
      await service.delete('S1');
      expect(indexDB.sedes.delete).toHaveBeenCalledWith('S1');
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.sedes.delete as jasmine.Spy).and.returnValue(Promise.reject('delete error'));
      await expectAsync(service.delete('S1')).toBeRejectedWith('delete error');
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe limpiar antes y agregar sedes con syncStatus', async () => {
      const clearSpy = spyOn(service, 'deleteFull').and.returnValue(dexiePromise());
      const data = [{ ...mockSede, syncStatus: null as any }];
      await service.bulkAdd(data);

      expect(clearSpy).toHaveBeenCalled();
      expect(indexDB.sedes.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.sedes.bulkAdd as jasmine.Spy).calls.argsFor(0)[0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.sedes.bulkAdd as jasmine.Spy).and.returnValue(Promise.reject('bulk error'));
      await expectAsync(service.bulkAdd([mockSede])).toBeRejectedWith('bulk error');
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar todas las sedes', async () => {
    await service.deleteFull();
    expect(indexDB.sedes.clear).toHaveBeenCalled();
  });
});
