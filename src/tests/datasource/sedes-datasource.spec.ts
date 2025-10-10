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

describe('SedesDataSource (Jest)', () => {
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
      toArray: jest.fn().mockReturnValue(dexiePromise([mockSede])),
      get: jest.fn().mockReturnValue(dexiePromise(mockSede)),
      add: jest.fn().mockReturnValue(dexiePromise('S1')),
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
    expect(indexDB.sedes.get).toHaveBeenCalledWith('S1');
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe agregar una nueva sede', async () => {
      const result = await service.create(mockSede);
      expect(result).toBe('S1');
      expect(indexDB.sedes.add).toHaveBeenCalledWith(mockSede);
    });

    it('debe manejar error en add()', async () => {
      (indexDB.sedes.add as jest.Mock).mockReturnValue(Promise.reject('DB error'));
      await expect(service.create(mockSede)).rejects.toBe('DB error');
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
      (indexDB.sedes.update as jest.Mock).mockReturnValue(Promise.reject('update error'));
      await expect(service.update('S1', {})).rejects.toBe('update error');
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar una sede', async () => {
      await service.delete('S1');
      expect(indexDB.sedes.delete).toHaveBeenCalledWith('S1');
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.sedes.delete as jest.Mock).mockReturnValue(Promise.reject('delete error'));
      await expect(service.delete('S1')).rejects.toBe('delete error');
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe limpiar antes y agregar sedes con syncStatus', async () => {
      const clearSpy = jest.spyOn(service, 'deleteFull').mockReturnValue(dexiePromise());
      const data = [{ ...mockSede, syncStatus: null as any }];
      await service.bulkAdd(data);

      expect(clearSpy).toHaveBeenCalled();
      expect(indexDB.sedes.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.sedes.bulkAdd as jest.Mock).mock.calls[0][0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.sedes.bulkAdd as jest.Mock).mockReturnValue(Promise.reject('bulk error'));
      await expect(service.bulkAdd([mockSede])).rejects.toBe('bulk error');
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar todas las sedes', async () => {
    await service.deleteFull();
    expect(indexDB.sedes.clear).toHaveBeenCalled();
  });
});
