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

describe('Parametros_generalesDataSource', () => {
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

    // Mock general de Dexie tabla
    (indexDB as any).parametros_generales = {
      toArray: jasmine.createSpy().and.returnValue(dexiePromise([mockData])),
      get: jasmine.createSpy().and.returnValue(dexiePromise(mockData)),
      add: jasmine.createSpy().and.returnValue(dexiePromise('P1')),
      update: jasmine.createSpy().and.returnValue(dexiePromise(1)),
      delete: jasmine.createSpy().and.returnValue(dexiePromise(undefined)),
      bulkAdd: jasmine.createSpy().and.returnValue(dexiePromise(undefined)),
      clear: jasmine.createSpy().and.returnValue(dexiePromise(undefined)),
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
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

    const [key] = (indexDB.parametros_generales.get as jasmine.Spy).calls.argsFor(0);
    expect(key).toBe('P1');


    expect(result?.nombre_parametro).toBe('Cultivarte');
  });

  // --- create ---
  it('🟢 create debe insertar un registro y retornar su id', async () => {
    const id = await service.create(mockData);
    expect(indexDB.parametros_generales.add).toHaveBeenCalledWith(mockData);
    expect(id).toBe('P1');
  });

  it('⚠️ create maneja error de inserción', async () => {
    (indexDB.parametros_generales.add as jasmine.Spy).and.callFake(() =>
      Promise.reject('DB Error')
    );
    await expectAsync(service.create(mockData)).toBeRejected();
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
    (indexDB.parametros_generales.update as jasmine.Spy).and.callFake(() =>
      Promise.reject('Error update')
    );
    await expectAsync(service.update('P1', {})).toBeRejected();
  });

  // --- delete ---
  it('🗑️ delete debe eliminar un registro por id', async () => {
    await service.delete('P1');
    expect(indexDB.parametros_generales.delete).toHaveBeenCalledWith('P1');
  });

  it('⚠️ delete maneja error al eliminar', async () => {
    (indexDB.parametros_generales.delete as jasmine.Spy).and.callFake(() =>
      Promise.reject('Error delete')
    );
    await expectAsync(service.delete('P1')).toBeRejected();
  });

  // --- bulkAdd ---
  it('📦 bulkAdd reemplaza todo y agrega nuevos registros con syncStatus por defecto', async () => {
    const data = [{ id_programa: 'P2', nombre: 'Otro', descripcion: 'desc' } as any];
    await service.bulkAdd(data);
    expect(indexDB.parametros_generales.clear).toHaveBeenCalled();
    const calledData = (indexDB.parametros_generales.bulkAdd as jasmine.Spy).calls.argsFor(0)[0];
    expect(calledData[0].syncStatus).toBe('synced');
  });

  it('⚠️ bulkAdd maneja error en clear', async () => {
    (indexDB.parametros_generales.clear as jasmine.Spy).and.callFake(() =>
      Promise.reject('Error clear')
    );
    await expectAsync(service.bulkAdd([mockData])).toBeRejected();
  });

  // --- deleteFull ---
  it('🧹 deleteFull debe limpiar toda la tabla', async () => {
    await service.deleteFull();
    expect(indexDB.parametros_generales.clear).toHaveBeenCalled();
  });
});
