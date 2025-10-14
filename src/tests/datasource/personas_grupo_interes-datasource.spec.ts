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

describe('Personas_grupo_interesDataSource (Jest)', () => {
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
      toArray: jest.fn().mockReturnValue(dexiePromise([mockRegistro])),
      get: jest.fn().mockReturnValue(dexiePromise(mockRegistro)),
      add: jest.fn().mockReturnValue(dexiePromise('PGI1')),
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
    expect(result[0].id_personas_grupo_interes).toBe('PGI1');
    expect(indexDB.personas_grupo_interes.toArray).toHaveBeenCalled();
  });

  // --- getById ---
  it('🟢 getById debe retornar un registro por id', async () => {
    const result = await service.getById('PGI1');
    expect(result?.id_persona).toBe('U1');
    expect(indexDB.personas_grupo_interes.get).toHaveBeenCalled();
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe crear un registro correctamente', async () => {
      const result = await service.create(mockRegistro);
      expect(result).toBe('PGI1');
      expect(indexDB.personas_grupo_interes.add).toHaveBeenCalled();
    });

    it('debe manejar error en add()', async () => {
      (indexDB.personas_grupo_interes.add as jest.Mock).mockReturnValue(
        Promise.reject('DB error'),
      );
      await expect(service.create(mockRegistro)).rejects.toBe('DB error');
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
      (indexDB.personas_grupo_interes.update as jest.Mock).mockReturnValue(
        Promise.reject('update error'),
      );
      await expect(service.update('PGI1', {})).rejects.toBe('update error');
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar correctamente', async () => {
      await service.delete('PGI1');
      expect(indexDB.personas_grupo_interes.delete).toHaveBeenCalled();
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.personas_grupo_interes.delete as jest.Mock).mockReturnValue(
        Promise.reject('delete error'),
      );
      await expect(service.delete('PGI1')).rejects.toBe('delete error');
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe agregar registros con syncStatus por defecto', async () => {
      const data = [{ ...mockRegistro, syncStatus: null as any }];
      await service.bulkAdd(data);
      expect(indexDB.personas_grupo_interes.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.personas_grupo_interes.bulkAdd as jest.Mock).mock
        .calls[0][0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.personas_grupo_interes.bulkAdd as jest.Mock).mockReturnValue(
        Promise.reject('bulk error'),
      );
      await expect(service.bulkAdd([mockRegistro])).rejects.toBe('bulk error');
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar toda la tabla', async () => {
    await service.deleteFull();
    expect(indexDB.personas_grupo_interes.clear).toHaveBeenCalled();
  });
});
