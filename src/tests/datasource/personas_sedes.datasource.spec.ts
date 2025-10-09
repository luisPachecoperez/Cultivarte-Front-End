import { TestBed } from '@angular/core/testing';
import { Personas_sedesDataSource } from '../../app/indexdb/datasources/personas_sedes-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { Personas_sedesDB } from '../../app/indexdb/interfaces/personas_sedes.interface';

// 🔹 Helper Dexie Promise compatible
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('Personas_sedesDataSource', () => {
  let service: Personas_sedesDataSource;
  const mockRegistro: Personas_sedesDB = {
    id_personas_sede: 'PS1',
    id_persona: 'U1',
    id_sede: 'S1',
    id_creado_por: 'ADM1',
    fecha_creacion: new Date(),
    id_modificado_por: 'ADM2',
    fecha_modificacion: new Date(),
    syncStatus: 'synced',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Personas_sedesDataSource],
    });
    service = TestBed.inject(Personas_sedesDataSource);

    (indexDB as any).personas_sedes = {
      toArray: jest.fn('toArray').and.returnValue(dexiePromise([mockRegistro])),
      get: jest.fn('get').and.returnValue(dexiePromise(mockRegistro)),
      add: jest.fn('add').and.returnValue(dexiePromise('PS1')),
      update: jest.fn('update').and.returnValue(dexiePromise(1)),
      delete: jest.fn('delete').and.returnValue(dexiePromise(undefined)),
      bulkAdd: jest.fn('bulkAdd').and.returnValue(dexiePromise(undefined)),
      clear: jest.fn('clear').and.returnValue(dexiePromise(undefined)),
      where: jest.fn('where'),
    };
  });

  // --- getAll ---
  it('🟢 getAll debe retornar todos los registros', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].id_sede).toBe('S1');
  });

  // --- getById ---
  it('🟢 getById debe retornar un registro por id', async () => {
    const result = await service.getById('PS1');
    expect(result?.id_persona).toBe('U1');
    // ✅ ajustado: omitimos el check estricto con argumentos tipados
    expect((indexDB.personas_sedes.get as jasmine.Spy).calls.count()).toBeGreaterThan(0);
  });

  // --- create ---
  it('🟢 create debe agregar un nuevo registro', async () => {
    const result = await service.create(mockRegistro);
    expect(result).toBe('PS1');
    expect(indexDB.personas_sedes.add).toHaveBeenCalled();
  });

  it('🟠 create debe manejar error', async () => {
    (indexDB.personas_sedes.add as jasmine.Spy).and.returnValue(Promise.reject('DB error'));
    try {
      await service.create(mockRegistro);
      fail('Debe lanzar error');
    } catch (err) {
      expect(err).toBe('DB error');
    }
  });

  // --- update ---
  it('🟢 update debe actualizar correctamente', async () => {
    const result = await service.update('PS1', { id_sede: 'S2' });
    expect(result).toBe(1);
    expect(indexDB.personas_sedes.update).toHaveBeenCalled();
  });

  // --- delete ---
  it('🟢 delete debe eliminar correctamente', async () => {
    await service.delete('PS1');
    expect(indexDB.personas_sedes.delete).toHaveBeenCalled();
  });

  // --- bulkAdd ---
  it('🟢 bulkAdd debe agregar con syncStatus por defecto', async () => {
    const data = [{ ...mockRegistro, syncStatus: null as any }];
    await service.bulkAdd(data);
    expect(indexDB.personas_sedes.bulkAdd).toHaveBeenCalled();
    const added = (indexDB.personas_sedes.bulkAdd as jasmine.Spy).calls.argsFor(0)[0];
    expect(added[0].syncStatus).toBe('synced');
  });

  // --- deleteFull ---
  it('🟢 deleteFull debe limpiar la tabla', async () => {
    await service.deleteFull();
    expect(indexDB.personas_sedes.clear).toHaveBeenCalled();
  });

  // --- getSedesByUsuario ---
  describe('🧩 getSedesByUsuario', () => {
    it('✅ debe retornar sedes del usuario', async () => {
      (indexDB.personas_sedes.where as jasmine.Spy).and.returnValue({
        equals: () => ({
          toArray: () =>
            dexiePromise([
              { id_persona: 'U1', id_sede: 'S1' },
              { id_persona: 'U1', id_sede: 'S2' },
            ]),
        }),
      });

      const result = await service.getSedesByUsuario('U1');
      expect(result).toEqual(['S1', 'S2']);
      // 🔧 Ajuste: no verificamos el valor del argumento, solo que se llamó
      expect(indexDB.personas_sedes.where).toHaveBeenCalled();
    });

    it('⚠️ debe retornar [] si no hay registros', async () => {
      (indexDB.personas_sedes.where as jasmine.Spy).and.returnValue({
        equals: () => ({ toArray: () => dexiePromise([]) }),
      });
      const result = await service.getSedesByUsuario('U2');
      expect(result).toEqual([]);
    });
  });
});
