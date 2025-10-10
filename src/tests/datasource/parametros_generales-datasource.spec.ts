import { TestBed } from '@angular/core/testing';
import { Parametros_generalesDataSource } from '../../app/indexdb/datasources/parametros_generales-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { Parametros_generalesDB } from '../../app/indexdb/interfaces/parametros_generales.interface';

/** 🧩 Helper: emula un PromiseExtended<T> de Dexie */
function dexiePromise<T>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('Parametros_generalesDataSource (Jest)', () => {
  let service: Parametros_generalesDataSource;

  const mockData: Parametros_generalesDB = {
    id_parametro_general: 'P1',
    nombre_parametro: 'Cultivarte',
    descripcion: 'Programa de prueba',
    syncStatus: 'synced',
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Parametros_generalesDataSource],
    });
    service = TestBed.inject(Parametros_generalesDataSource);

    (indexDB as any).parametros_generales = {
      toArray: jest.fn().mockReturnValue(dexiePromise([mockData])),
      get: jest.fn().mockReturnValue(dexiePromise(mockData)),
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
  it('🔹 getAll debe retornar todos los registros', async () => {
    const result = await service.getAll();
    expect(indexDB.parametros_generales.toArray).toHaveBeenCalled();
    expect(result.length).toBe(1);
    expect(result[0].id_parametro_general).toBe('P1');
  });

  // --- getById ---
  it('🔹 getById debe retornar un registro por id', async () => {
    const result = await service.getById('P1');
    expect(indexDB.parametros_generales.get).toHaveBeenCalledWith('P1');
    expect(result?.nombre_parametro).toBe('Cultivarte');
  });

  // --- create ---
  it('🟢 create debe insertar un registro y retornar su id', async () => {
    const id = await service.create(mockData);
    expect(indexDB.parametros_generales.add).toHaveBeenCalledWith(mockData);
    expect(id).toBe('P1');
  });

  it('⚠️ create maneja error de inserción', async () => {
    (indexDB.parametros_generales.add as jest.Mock).mockReturnValue(Promise.reject('DB Error'));
    await expect(service.create(mockData)).rejects.toBe('DB Error');
  });

  // --- update ---
  it('🟢 update debe modificar un registro existente', async () => {
    const count = await service.update('P1', { nombre_parametro: 'Nuevo' });
    expect(indexDB.parametros_generales.update).toHaveBeenCalledWith('P1', {
      nombre_parametro: 'Nuevo',
    });
    expect(count).toBe(1);
  });

  it('⚠️ update maneja error al actualizar', async () => {
    (indexDB.parametros_generales.update as jest.Mock).mockReturnValue(Promise.reject('Error update'));
    await expect(service.update('P1', {})).rejects.toBe('Error update');
  });

  // --- delete ---
  it('🗑️ delete debe eliminar un registro por id', async () => {
    await service.delete('P1');
    expect(indexDB.parametros_generales.delete).toHaveBeenCalledWith('P1');
  });

  it('⚠️ delete maneja error al eliminar', async () => {
    (indexDB.parametros_generales.delete as jest.Mock).mockReturnValue(Promise.reject('Error delete'));
    await expect(service.delete('P1')).rejects.toBe('Error delete');
  });

  // --- bulkAdd ---
  it('📦 bulkAdd reemplaza todo y agrega nuevos registros con syncStatus por defecto', async () => {
    const data = [{ id_programa: 'P2', nombre: 'Otro', descripcion: 'desc' } as any];
    await service.bulkAdd(data);
    expect(indexDB.parametros_generales.clear).toHaveBeenCalled();
    const calledData = (indexDB.parametros_generales.bulkAdd as jest.Mock).mock.calls[0][0];
    expect(calledData[0].syncStatus).toBe('synced');
  });

  it('⚠️ bulkAdd maneja error en clear', async () => {
    (indexDB.parametros_generales.clear as jest.Mock).mockReturnValue(Promise.reject('Error clear'));
    await expect(service.bulkAdd([mockData])).rejects.toBe('Error clear');
  });

  // --- deleteFull ---
  it('🧹 deleteFull debe limpiar toda la tabla', async () => {
    await service.deleteFull();
    expect(indexDB.parametros_generales.clear).toHaveBeenCalled();
  });
});
