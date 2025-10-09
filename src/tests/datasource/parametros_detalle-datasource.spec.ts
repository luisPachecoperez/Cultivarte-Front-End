import { TestBed } from '@angular/core/testing';
import { Parametros_detalleDataSource } from '../../app/indexdb/datasources/parametros_detalle-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { Parametros_detalleDB } from '../../app/indexdb/interfaces/parametros_detalle.interface';

// 🧩 Helper Dexie Promise compatible
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('Parametros_detalleDataSource', () => {
  let service: Parametros_detalleDataSource;
  const mockDetalle: Parametros_detalleDB = {
    id_parametro_detalle: 'D1',
    id_parametro_general: 'G1',
    nombre: 'Cultivarte',
    codigo: 'CULT',
    orden: 1,
    valores: 'VAL',
    estado: 'A',
    id_creado_por: 'USR1',
    fecha_creacion: new Date(),
    id_modificado_por: 'USR2',
    fecha_modificacion: new Date(),
    syncStatus: 'synced',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Parametros_detalleDataSource],
    });

    service = TestBed.inject(Parametros_detalleDataSource);

    (indexDB as any).parametros_detalle = {
      toArray: jest.fn('toArray').and.returnValue(dexiePromise([mockDetalle])),
      get: jest.fn('get').and.returnValue(dexiePromise(mockDetalle)),
      add: jest.fn('add').and.returnValue(dexiePromise('D1')),
      update: jest.fn('update').and.returnValue(dexiePromise(1)),
      delete: jest.fn('delete').and.returnValue(dexiePromise(undefined)),
      bulkAdd: jest.fn('bulkAdd').and.returnValue(dexiePromise(undefined)),
      clear: jest.fn('clear').and.returnValue(dexiePromise(undefined)),
    };
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // --- getAll ---
  it('🔹 getAll debe retornar todos los registros', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].nombre).toBe('Cultivarte');
    expect(indexDB.parametros_detalle.toArray).toHaveBeenCalled();
  });

  // --- getById ---
  it('🔹 getById debe retornar un registro por id', async () => {
    const result = await service.getById('D1');
    expect(result?.codigo).toBe('CULT');
    expect(indexDB.parametros_detalle.get).toHaveBeenCalled();
    expect((indexDB.parametros_detalle.get as jasmine.Spy).calls.argsFor(0)[0]).toBe('D1');
  });

  // --- create ---
  describe('🟢 create', () => {
    it('debe crear correctamente un registro', async () => {
      const result = await service.create(mockDetalle);
      expect(indexDB.parametros_detalle.add).toHaveBeenCalledWith(mockDetalle);
      expect(result).toBe('D1');
    });

    it('debe manejar error en add()', async () => {
      (indexDB.parametros_detalle.add as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
      await expectAsync(service.create(mockDetalle)).toBeRejectedWith('DB error');
    });
  });

  // --- update ---
  describe('🟢 update', () => {
    it('debe actualizar correctamente y retornar número', async () => {
      const result = await service.update('D1', { nombre: 'Nuevo' });
      expect(indexDB.parametros_detalle.update).toHaveBeenCalledWith('D1', { nombre: 'Nuevo' });
      expect(result).toBe(1);
    });

    it('debe manejar error en update()', async () => {
      (indexDB.parametros_detalle.update as jasmine.Spy).and.returnValue(Promise.reject('Error update'));
      await expectAsync(service.update('D1', {})).toBeRejectedWith('Error update');
    });
  });

  // --- delete ---
  describe('🟢 delete', () => {
    it('debe eliminar un registro correctamente', async () => {
      await service.delete('D1');
      expect(indexDB.parametros_detalle.delete).toHaveBeenCalledWith('D1');
    });

    it('debe manejar error en delete()', async () => {
      (indexDB.parametros_detalle.delete as jasmine.Spy).and.returnValue(Promise.reject('Error delete'));
      await expectAsync(service.delete('D1')).toBeRejectedWith('Error delete');
    });
  });

  // --- bulkAdd ---
  describe('🟢 bulkAdd', () => {
    it('debe borrar todo antes de agregar', async () => {
      const data = [{ ...mockDetalle, syncStatus: null as any }];
      const clearSpy = spyOn(service, 'deleteFull').and.returnValue(dexiePromise());
      await service.bulkAdd(data);
      expect(clearSpy).toHaveBeenCalled();
      expect(indexDB.parametros_detalle.bulkAdd).toHaveBeenCalled();
      const added = (indexDB.parametros_detalle.bulkAdd as jasmine.Spy).calls.argsFor(0)[0];
      expect(added[0].syncStatus).toBe('synced');
    });

    it('debe manejar error en bulkAdd()', async () => {
      (indexDB.parametros_detalle.bulkAdd as jasmine.Spy).and.returnValue(Promise.reject('error'));
      await expectAsync(service.bulkAdd([mockDetalle])).toBeRejectedWith('error');
    });
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar toda la tabla', async () => {
    await service.deleteFull();
    expect(indexDB.parametros_detalle.clear).toHaveBeenCalled();
  });
});
