import { TestBed } from '@angular/core/testing';
import { PersonasProgramasDataSource } from '../../app/indexdb/datasources/personas_programas-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { PersonasProgramasDB } from '../../app/indexdb/interfaces/personas_programas.interface';

// 🔹 Helper tipo Dexie
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('PersonasProgramasDataSource (Jest)', () => {
  let service: PersonasProgramasDataSource;

  const mockRegistro: PersonasProgramasDB = {
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
      providers: [PersonasProgramasDataSource],
    });
    service = TestBed.inject(PersonasProgramasDataSource);

    (indexDB as any).personas_programas = {
      toArray: jest.fn().mockReturnValue(dexiePromise([mockRegistro])),
      get: jest.fn().mockReturnValue(dexiePromise(mockRegistro)),
      add: jest.fn().mockReturnValue(dexiePromise('PP1')),
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
    expect(indexDB.personas_programas.get).toHaveBeenCalledWith('PP1');
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe crear un registro correctamente', async () => {
      const result = await service.create(mockRegistro);
      expect(result).toBe('PP1');
      expect(indexDB.personas_programas.add).toHaveBeenCalled();
    });

    it('debe manejar error en add()', async () => {
      (indexDB.personas_programas.add as jest.Mock).mockReturnValue(
        Promise.reject('DB error'),
      );
      await expect(service.create(mockRegistro)).rejects.toBe('DB error');
    });
  });

  // --- update ---
  describe('🟢 update', () => {
    it('debe actualizar correctamente', async () => {
      const result = await service.update('PP1', { id_programa: 'PR2' });
      expect(result).toBe(1);
      expect(indexDB.personas_programas.update).toHaveBeenCalledWith('PP1', {
        id_programa: 'PR2',
      });
    });

    it('debe manejar error en update()', async () => {
      (indexDB.personas_programas.update as jest.Mock).mockReturnValue(
        Promise.reject('update error'),
      );
      await expect(service.update('PP1', {})).rejects.toBe('update error');
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar correctamente', async () => {
      await service.delete('PP1');
      expect(indexDB.personas_programas.delete).toHaveBeenCalledWith('PP1');
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.personas_programas.delete as jest.Mock).mockReturnValue(
        Promise.reject('delete error'),
      );
      await expect(service.delete('PP1')).rejects.toBe('delete error');
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe agregar registros con syncStatus por defecto', async () => {
      const data = [{ ...mockRegistro, syncStatus: null as any }];
      await service.bulkAdd(data);
      expect(indexDB.personas_programas.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.personas_programas.bulkAdd as jest.Mock).mock
        .calls[0][0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.personas_programas.bulkAdd as jest.Mock).mockReturnValue(
        Promise.reject('bulk error'),
      );
      await expect(service.bulkAdd([mockRegistro])).rejects.toBe('bulk error');
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar toda la tabla', async () => {
    await service.deleteFull();
    expect(indexDB.personas_programas.clear).toHaveBeenCalled();
  });
});
