import { TestBed } from '@angular/core/testing';
import { PoblacionesDataSource } from '../../app/indexdb/datasources/poblaciones-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { PoblacionesDB } from '../../app/indexdb/interfaces/poblaciones.interface';

// 🔹 Helper para promesas tipo Dexie
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('PoblacionesDataSource (Jest)', () => {
  let service: PoblacionesDataSource;

  const mockPoblacion: PoblacionesDB = {
    id_poblacion: 'P1',
    id_padre: 'D1',
    nombre: 'Armenia',
    syncStatus: 'synced',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoblacionesDataSource],
    });
    service = TestBed.inject(PoblacionesDataSource);

    (indexDB as any).poblaciones = {
      toArray: jest.fn().mockReturnValue(dexiePromise([mockPoblacion])),
      get: jest.fn().mockReturnValue(dexiePromise(mockPoblacion)),
      add: jest.fn().mockReturnValue(dexiePromise('P1')),
      update: jest.fn().mockReturnValue(dexiePromise(1)),
      delete: jest.fn().mockReturnValue(dexiePromise(undefined)),
      bulkAdd: jest.fn().mockReturnValue(dexiePromise(undefined)),
      clear: jest.fn().mockReturnValue(dexiePromise(undefined)),
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    jest.clearAllMocks();
  });

  // --- getAll ---
  it('🟢 getAll debe retornar todas las poblaciones', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].nombre).toBe('Armenia');
    expect(indexDB.poblaciones.toArray).toHaveBeenCalled();
  });

  // --- getById ---
  it('🟢 getById debe retornar una población por id', async () => {
    const result = await service.getById('P1');
    expect(result?.id_poblacion).toBe('P1');
    expect(indexDB.poblaciones.get).toHaveBeenCalledWith('P1');
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe agregar una población', async () => {
      const result = await service.create(mockPoblacion);
      expect(result).toBe('P1');
      expect(indexDB.poblaciones.add).toHaveBeenCalledWith(mockPoblacion);
    });

    it('debe manejar error en add()', async () => {
      (indexDB.poblaciones.add as jest.Mock).mockReturnValue(
        Promise.reject('DB error'),
      );
      await expect(service.create(mockPoblacion)).rejects.toBe('DB error');
    });
  });

  // --- update ---
  describe('🟢 update', () => {
    it('debe actualizar correctamente', async () => {
      const result = await service.update('P1', { nombre: 'Calarcá' });
      expect(result).toBe(1);
      expect(indexDB.poblaciones.update).toHaveBeenCalledWith('P1', {
        nombre: 'Calarcá',
      });
    });

    it('debe manejar error en update()', async () => {
      (indexDB.poblaciones.update as jest.Mock).mockReturnValue(
        Promise.reject('update error'),
      );
      await expect(service.update('P1', {})).rejects.toBe('update error');
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar correctamente', async () => {
      await service.delete('P1');
      expect(indexDB.poblaciones.delete).toHaveBeenCalledWith('P1');
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.poblaciones.delete as jest.Mock).mockReturnValue(
        Promise.reject('delete error'),
      );
      await expect(service.delete('P1')).rejects.toBe('delete error');
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe limpiar y agregar poblaciones con syncStatus', async () => {
      const clearSpy = jest
        .spyOn(service, 'deleteFull')
        .mockReturnValue(dexiePromise());
      const data = [{ ...mockPoblacion, syncStatus: null as any }];
      await service.bulkAdd(data);

      expect(clearSpy).toHaveBeenCalled();
      expect(indexDB.poblaciones.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.poblaciones.bulkAdd as jest.Mock).mock.calls[0][0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.poblaciones.bulkAdd as jest.Mock).mockReturnValue(
        Promise.reject('bulk error'),
      );
      await expect(service.bulkAdd([mockPoblacion])).rejects.toBe('bulk error');
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar todas las poblaciones', async () => {
    await service.deleteFull();
    expect(indexDB.poblaciones.clear).toHaveBeenCalled();
  });
});
