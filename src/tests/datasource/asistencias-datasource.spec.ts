// ✅ src/tests/datasource/asistencias-datasource.spec.ts
import { TestBed } from '@angular/core/testing';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { AsistenciasDB } from '../../app/indexdb/interfaces/asistencias.interface';

// Helper Dexie Promise compatible
function dexiePromise<T = any>(value?: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => p;
  return p;
}

describe('✅ AsistenciasDataSource (Jest)', () => {
  let service: AsistenciasDataSource;

  const mockAsistencia: AsistenciasDB = {
    id_asistencia: 'A1',
    id_actividad: 'ACT1',
    id_sesion: 'S1',
    id_persona: 'P1',
    syncStatus: 'synced',
    deleted: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsistenciasDataSource],
    });

    service = TestBed.inject(AsistenciasDataSource);

    (indexDB as any).asistencias = {
      toArray: jest.fn().mockReturnValue(dexiePromise([mockAsistencia])),
      get: jest.fn().mockReturnValue(dexiePromise(mockAsistencia)),
      add: jest.fn().mockReturnValue(dexiePromise('A1')),
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

  // ---------------- getAll ----------------
  it('📋 debe retornar todas las asistencias (default: 1 elemento)', async () => {
    const result = await service.getAll();
    expect(indexDB.asistencias.toArray).toHaveBeenCalledTimes(1);
    expect(result.length).toBe(1);
    expect(result[0].id_asistencia).toBe('A1');
  });

  it('📭 debe retornar arreglo vacío cuando no hay registros', async () => {
    (indexDB.asistencias.toArray as jest.Mock).mockReturnValue(
      dexiePromise([]),
    );
    const result = await service.getAll();
    expect(result).toEqual([]);
  });
  it('🔎 debe retornar una asistencia por id', async () => {
    // ⚙️ Se fuerza el mock con signatura genérica
    (indexDB.asistencias.get as unknown as jest.Mock<[any?, any?], any>) = jest
      .fn()
      .mockReturnValue(dexiePromise(mockAsistencia));

    const result = await service.getById('A1');

    // ✅ Se ignora el número de parámetros esperados por Dexie
    expect(indexDB.asistencias.get as jest.Mock).toHaveBeenCalled();
    const args = (indexDB.asistencias.get as jest.Mock).mock.calls[0];
    expect(args[0]).toBe('A1');
    expect(result?.id_persona).toBe('P1');
  });

  it('❌ debe retornar undefined si no existe el id', async () => {
    (indexDB.asistencias.get as unknown as jest.Mock<[any?, any?], any>) = jest
      .fn()
      .mockReturnValue(dexiePromise(undefined));

    const result = await service.getById('NOEXISTE');

    expect(indexDB.asistencias.get as jest.Mock).toHaveBeenCalled();
    const args = (indexDB.asistencias.get as jest.Mock).mock.calls[0];
    expect(args[0]).toBe('NOEXISTE');
    expect(result).toBeUndefined();
  });

  // ---------------- create ----------------
  describe('create', () => {
    it('🟢 debe crear correctamente y retornar GraphQLResponse (S)', async () => {
      const result = await service.create(mockAsistencia); // 👈 Faltaba esta línea
      expect(indexDB.asistencias.add).toHaveBeenCalledWith(mockAsistencia);
      expect(indexDB.asistencias.add).toHaveBeenCalled();
      expect(result.mensaje).toContain('adicionado');
    });

    it('🔴 debe manejar error cuando add() rechaza', async () => {
      (indexDB.asistencias.add as jest.Mock).mockRejectedValue('DB error');

      try {
        await service.create(mockAsistencia);
        fail('La promesa debía ser rechazada');
      } catch (error) {
        expect(error).toBe('DB error');
      }

      expect(indexDB.asistencias.add).toHaveBeenCalledWith(mockAsistencia);
    });
  });

  // ---------------- update ----------------
  describe('delete', () => {
    it('🟢 soft delete cuando soft=true (update)', async () => {
      const result = await service.delete('A1', true);

      expect(indexDB.asistencias.update).toHaveBeenCalledWith('A1', {
        deleted: true,
      });
      expect(indexDB.asistencias.delete).not.toHaveBeenCalled();

      // ✅ valida la respuesta GraphQLResponse
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toBe('Registro actualizado');
    });

    it('🟢 hard delete cuando soft=false (delete)', async () => {
      const result = await service.delete('A1', false);

      expect(indexDB.asistencias.delete).toHaveBeenCalledWith('A1');
      expect(indexDB.asistencias.update).not.toHaveBeenCalled();

      // ✅ valida la respuesta GraphQLResponse
      expect(result.exitoso).toBe('S');
      expect(result.mensaje).toBe('Registro actualizado');
    });

    it('🔴 debe manejar error si update() rechaza en soft delete', async () => {
      (indexDB.asistencias.update as jest.Mock).mockRejectedValue('upd-error');

      try {
        await service.delete('A1', true);
        fail('La promesa debía ser rechazada');
      } catch (error) {
        expect(error).toBe('upd-error');
      }

      expect(indexDB.asistencias.update).toHaveBeenCalledWith('A1', {
        deleted: true,
      });
      expect(indexDB.asistencias.delete).not.toHaveBeenCalled();
    });

    it('🔴 debe manejar error si delete() rechaza en hard delete', async () => {
      (indexDB.asistencias.delete as jest.Mock).mockRejectedValue('del-error');

      try {
        await service.delete('A1', false);
        fail('La promesa debía ser rechazada');
      } catch (error) {
        expect(error).toBe('del-error');
      }

      expect(indexDB.asistencias.delete).toHaveBeenCalledWith('A1');
      expect(indexDB.asistencias.update).not.toHaveBeenCalled();
    });
  });

  // ---------------- bulkAdd ----------------
  describe('bulkAdd', () => {
    it('🟢 establece syncStatus="synced" cuando viene null/undefined', async () => {
      const data: AsistenciasDB[] = [
        { ...mockAsistencia, id_asistencia: 'A2', syncStatus: null as any },
        {
          ...mockAsistencia,
          id_asistencia: 'A3',
          syncStatus: undefined as any,
        },
      ];

      await service.bulkAdd(data);

      // ✅ Verificamos que se llamó a bulkAdd una sola vez
      expect(indexDB.asistencias.bulkAdd).toHaveBeenCalledTimes(1);

      // ✅ Obtenemos los registros pasados al método
      const passed = (indexDB.asistencias.bulkAdd as jest.Mock).mock
        .calls[0][0] as AsistenciasDB[];

      // ✅ Los syncStatus deben haber sido normalizados a 'synced'
      expect(passed[0].syncStatus).toBe('synced');
      expect(passed[1].syncStatus).toBe('synced');

      // ✅ bulkAdd no debe llamar add()
      expect(indexDB.asistencias.add).not.toHaveBeenCalled();
    });

    it('🟢 conserva syncStatus existente', async () => {
      const data: AsistenciasDB[] = [
        {
          ...mockAsistencia,
          id_asistencia: 'A4',
          syncStatus: 'pending-create' as any,
        },
        { ...mockAsistencia, id_asistencia: 'A5', syncStatus: 'synced' as any },
      ];

      await service.bulkAdd(data);

      // Se llamó bulkAdd
      expect(indexDB.asistencias.bulkAdd).toHaveBeenCalled();

      const passed = (indexDB.asistencias.bulkAdd as jest.Mock).mock
        .calls[0][0] as AsistenciasDB[];

      const a4 = passed.find((a) => a.id_asistencia === 'A4')!;
      const a5 = passed.find((a) => a.id_asistencia === 'A5')!;
      expect(a4.syncStatus).toBe('pending-create');
      expect(a5.syncStatus).toBe('synced');

      // bulkAdd no debe invocar add()
      expect(indexDB.asistencias.add).not.toHaveBeenCalled();
    });

    it('🔴 maneja error si bulkAdd() rechaza', async () => {
      (indexDB.asistencias.bulkAdd as jest.Mock).mockRejectedValue(
        'bulk-error',
      );

      try {
        await service.bulkAdd([mockAsistencia]);
        // Si llega aquí, no lanzó error ⇒ forzamos fallo
        fail('La promesa debió rechazar');
      } catch (error) {
        expect(error).toBe('bulk-error');
      }

      expect(indexDB.asistencias.bulkAdd).toHaveBeenCalledWith([
        mockAsistencia,
      ]);
    });
  });

  // ---------------- deleteFull ----------------
  it('🧹 debe limpiar toda la tabla (clear)', async () => {
    await service.deleteFull();
    expect(indexDB.asistencias.clear).toHaveBeenCalledTimes(1);
    expect(indexDB.asistencias.add).not.toHaveBeenCalled();
  });
});
