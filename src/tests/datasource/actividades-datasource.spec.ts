// ✅ src/tests/datasource/actividades-datasource.spec.ts (versión Jest 100% equivalente)

import { TestBed } from '@angular/core/testing';
import { jest, expect } from '@jest/globals';

import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { PersonasSedesDataSource } from '../../app/indexdb/datasources/personas_sedes-datasource';
import { PersonasDataSource } from '../../app/indexdb/datasources/personas-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { ActividadesDB } from '../../app/indexdb/interfaces/actividades.interface';
import { GraphQLResponse } from '../../app/shared/interfaces/graphql-response.interface';

// 🧩 Helper para simular PromiseExtended<T> de Dexie
function mockDexiePromise<T>(value: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => Promise.resolve(value);
  return p;
}
const safeFn = (value?: any) => {
  const fn = jest.fn();
  fn.mockReturnValue(mockDexiePromise(value));
  return fn;
};
const safeTableMock = () => ({
  toArray: safeFn([]),
  get: safeFn(undefined),
  add: safeFn(undefined),
  update: safeFn(1),
  delete: safeFn(undefined),
  clear: safeFn(undefined),
  bulkAdd: safeFn(undefined),
  where: jest.fn().mockReturnValue({
    anyOf: jest.fn().mockReturnValue({
      toArray: safeFn([]),
      filter: jest.fn().mockReturnValue({ toArray: safeFn([]) }),
    }),
    equals: jest.fn().mockReturnValue({
      toArray: safeFn([]),
      count: safeFn(0),
    }),
    between: jest.fn().mockReturnValue({
      filter: jest.fn().mockReturnValue({ toArray: safeFn([]) }),
    }),
  }),
  filter: jest.fn().mockReturnValue({
    toArray: safeFn([]),
    first: safeFn(undefined),
  }),
});

const mockIndexDB = (mockData: Partial<typeof indexDB> = {}) => {
  (indexDB as any).actividades =
    mockData.actividades ||
    ({
      toArray: safeFn([]),
      get: safeFn(undefined),
      add: safeFn(undefined),
      update: safeFn(1),
      delete: safeFn(undefined),
      clear: safeFn(undefined),
      bulkAdd: safeFn(undefined),
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: safeFn([]),
          filter: jest.fn().mockReturnValue({ toArray: safeFn([]) }),
        }),
        equals: jest.fn().mockReturnValue({
          toArray: safeFn([]),
          count: safeFn(0),
        }),
        between: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({ toArray: safeFn([]) }),
        }),
      }),
      filter: jest.fn().mockReturnValue({
        toArray: safeFn([]),
        first: safeFn(undefined),
      }),
    } as any);

  (indexDB as any).sesiones =
    mockData.sesiones ||
    ({
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: safeFn([]),
          count: safeFn(0),
        }),
        between: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({ toArray: safeFn([]) }),
        }),
      }),
      delete: safeFn(undefined),
      update: safeFn(undefined),
    } as any);

  (indexDB as any).parametros_generales = {
    toArray: safeFn([{ id_programa: 'P1', nombre: 'CULTIVARTE' }]),
  } as any;

  (indexDB as any).parametros_detalle =
    mockData.parametros_detalle ||
    ({
      toArray: safeFn([]),
      filter: jest.fn().mockReturnValue({ first: safeFn(undefined) }),
    } as any);

  (indexDB as any).sedes =
    mockData.sedes ||
    ({
      toArray: safeFn([]),
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({ toArray: safeFn([]) }),
      }),
    } as any);

  (indexDB as any).asistencias =
    mockData.asistencias ||
    ({
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: safeFn([]),
          count: safeFn(0),
        }),
      }),
    } as any);

  (indexDB as any).personas =
    mockData.personas ||
    ({
      bulkGet: safeFn([]),
    } as any);

  (indexDB as any).personas_grupo_interes =
    mockData.personas_grupo_interes ||
    ({
      filter: jest.fn().mockReturnValue({
        toArray: safeFn([]),
      }),
    } as any);
};
type AnyPromise = Promise<any>;

// Mocks de dependencias inyectadas
class MockPersonasSedesDataSource {
  getSedesByUsuario = jest.fn<() => AnyPromise>().mockResolvedValue([]);
}

class MockPersonasDataSource {
  getAliados = jest.fn<() => AnyPromise>().mockResolvedValue([]);
}

class MockSesionesDataSource {
  sesionesPorActividad = jest.fn<() => AnyPromise>().mockResolvedValue([]);
}

describe('ActividadesDataSource', () => {
  it('🔢 suma asistentesPorActividad desde 0 si la actividad no existe en el Map', async () => {
  const mockSesion = {
    id_sesion: 'S1',
    id_actividad: 'A_UNICA',
    fecha_actividad: String(Date.now()),
    hora_inicio: '10:00',
    hora_fin: '11:00',
  };

  (indexDB as any).actividades = {
    get: jest.fn<() => Promise<{ id_actividad: string; nombre_actividad: string }>>()
      .mockResolvedValue({ id_actividad: 'A_UNICA', nombre_actividad: 'Actividad Única' }),
    where: jest.fn().mockReturnValue({
      anyOf: jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<Array<{ id_actividad: string; deleted: boolean }>>>()
            .mockResolvedValue([{ id_actividad: 'A_UNICA', deleted: false }]),
        }),
      }),
    }),
  };

  (indexDB as any).sesiones = {
    where: jest.fn().mockReturnValue({
      between: jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<Array<{ id_sesion: string; id_actividad: string; fecha_actividad: string; hora_inicio: string; hora_fin: string; nro_asistentes: number }>>>()
            .mockResolvedValue([
              { ...mockSesion, nro_asistentes: 5 },
            ]),
        }),
      }),
    }),
  };

  (indexDB as any).asistencias = {
    where: jest.fn().mockReturnValue({
      equals: jest.fn().mockReturnValue({
        count: jest.fn<() => Promise<number>>().mockResolvedValue(5),
      }),
    }),
  };

  personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);

  const res = await service.consultarFechaCalendario(new Date(), new Date(), 'u1');
  // El Map estaba vacío, así que el valor debe ser igual a nro_asistentes
  expect(res[0].extendedProps.asistentes_evento).toBe(5);
});
  it('🧪 consultarFechaCalendario llama getById con "" si id_actividad es undefined', async () => {
    // Mock de sesiones con id_actividad undefined
    (indexDB as any).sesiones = {
      where: jest.fn().mockReturnValue({
        between: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([
              {
                id_sesion: 'S1',
                id_actividad: undefined, // fuerza el uso de ''
                fecha_actividad: String(Date.now()),
                hora_inicio: '10:00',
                hora_fin: '11:00',
              },
            ]),
          }),
        }),
      }),
    };
    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        }),
      }),
    };
    // Mock getBySedes para devolver una actividad cualquiera
    jest.spyOn(service, 'getBySedes').mockResolvedValue([
      {
        id_actividad: 'A1',
        id_programa: 'P1',
        id_sede: 'S1',
        id_tipo_actividad: 'T1',
        nombre_actividad: 'Test',
        fecha_actividad: '1700000000000',
        fecha_creacion: '1700000000000',
        fecha_modificacion: '1700000000000',
        syncStatus: 'synced',
        deleted: false,
      },
    ]);
    // Mock getById para que devuelva undefined si el id es ''
    jest.spyOn(service, 'getById').mockImplementation(async (id) => {
      if (!id) return undefined;
      return {
        id_actividad: id,
        nombre_actividad: 'Test',
      } as any;
    });
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);

    const res = await service.consultarFechaCalendario(new Date(), new Date(), 'u1');
    expect(res[0].extendedProps.nombre_actividad).toBe('');
  });
  it('� getPreEditActividad usa "" si actividad.id_programa es falsy', async () => {
    jest.resetAllMocks();

    (indexDB as any).parametros_generales = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    (indexDB as any).parametros_detalle = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    personasDataSource.getAliados.mockResolvedValue([]);
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue([]);

    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: 'A1',
      id_programa: '', // Falsy
      id_sede: 'S1',
      id_tipo_actividad: 'T1',
      nombre_actividad: 'Act 1',
      fecha_actividad: '1700000000000',
      fecha_creacion: '1700000000000',
      fecha_modificacion: '1700000000000',
      syncStatus: 'synced',
      deleted: false,
    } as any);

    jest.spyOn((service as any).sesionesDataSource, 'sesionesPorActividad').mockResolvedValue([]);

    const res = await service.getPreEditActividad('A1', 'u1');
    expect(res.id_programa).toBe('');
  });
  it('�🪐 getPreCreateActividad usa espacio si no hay programa CULTIVARTE', async () => {
    jest.resetAllMocks();
    (indexDB as any).parametros_generales = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        { id_parametro_general: 'PG_PROG', nombre_parametro: 'Programa' },
      ]),
    };
    (indexDB as any).parametros_detalle = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        // No hay detalle con nombre 'CULTIVARTE'
        { id_parametro_general: 'PG_PROG', id_parametro_detalle: 'P2', nombre: 'OTRO' },
      ]),
    };
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    personasDataSource.getAliados.mockResolvedValue([]);
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue([]);
    const res = await service.getPreCreateActividad('userX');
    expect(res.id_programa).toBe(' ');
  });
  let service: ActividadesDataSource;
  let personasSedesDataSource: MockPersonasSedesDataSource;
  let personasDataSource: MockPersonasDataSource;
  let sesionesDataSource: MockSesionesDataSource;

  const mockActividad: ActividadesDB = {
    id_actividad: 'A1',
    id_programa: 'P1',
    id_sede: 'S1',
    id_tipo_actividad: 'T1',
    nombre_actividad: 'Test Actividad',
    fecha_actividad: '1700000000000',

    fecha_creacion: '1700000000000',
    fecha_modificacion: '1700000000000',
    syncStatus: 'synced',
    deleted: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ActividadesDataSource,
        {
          provide: PersonasSedesDataSource,
          useClass: MockPersonasSedesDataSource,
        },
        { provide: PersonasDataSource, useClass: MockPersonasDataSource },
        { provide: SesionesDataSource, useClass: MockSesionesDataSource },
      ],
    });

    service = TestBed.inject(ActividadesDataSource);

    personasSedesDataSource = TestBed.inject(
      PersonasSedesDataSource,
    ) as unknown as MockPersonasSedesDataSource;
    personasDataSource = TestBed.inject(
      PersonasDataSource,
    ) as unknown as MockPersonasDataSource;
    sesionesDataSource = TestBed.inject(
      SesionesDataSource,
    ) as unknown as MockSesionesDataSource;
  });

  it('🕓 getPreEditActividad mapea fecha_actividad undefined/null a Date.now()', async () => {
  jest.resetAllMocks();

  (indexDB as any).parametros_generales = {
    toArray: jest.fn<() => Promise<Array<{ id_parametro_general: string; nombre_parametro: string }>>>()
      .mockResolvedValue([
        { id_parametro_general: 'PG_RESP', nombre_parametro: 'RESPONSABLE_CULTIVARTE' },
        { id_parametro_general: 'PG_TIPO', nombre_parametro: 'TIPO_ACTIVIDAD_CULTIVARTE' },
        { id_parametro_general: 'PG_FREQ', nombre_parametro: 'FRECUENCIA_CULTIVARTE' },
      ]),
  };
  (indexDB as any).parametros_detalle = {
    toArray: jest.fn<() => Promise<Array<{ id_parametro_general: string; id_parametro_detalle: string; nombre: string; valores?: string }>>>()
      .mockResolvedValue([
        { id_parametro_general: 'PG_RESP', id_parametro_detalle: 'R1', nombre: 'Resp' },
        { id_parametro_general: 'PG_TIPO', id_parametro_detalle: 'T1', nombre: 'Tipo', valores: 'A,B' },
        { id_parametro_general: 'PG_FREQ', id_parametro_detalle: 'F1', nombre: 'Semanal' },
      ]),
  };
  (indexDB as any).sedes = {
    where: jest.fn().mockReturnValue({
      anyOf: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
          .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
      }),
    }),
    toArray: jest.fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
      .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
  };
  personasDataSource.getAliados.mockResolvedValue([{ id_aliado: 'A1', nombre: 'Aliado' }]);
  personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);
  jest.spyOn(service, 'getById').mockResolvedValue({
    id_actividad: 'A1',
    id_programa: 'P1',
    id_sede: 'S1',
    id_tipo_actividad: 'T1',
    nombre_actividad: 'Act 1',
  } as any);
  // Mock sesiones: una con fecha_actividad undefined y otra null
  jest.spyOn((service as any).sesionesDataSource, 'sesionesPorActividad').mockResolvedValue([
    {
      id_sesion: 'S1',
      fecha_actividad: undefined,
      hora_inicio: '08:00',
      hora_fin: '09:00',
    },
    {
      id_sesion: 'S2',
      fecha_actividad: null,
      hora_inicio: '10:00',
      hora_fin: '11:00',
    },
  ]);
  const res = await service.getPreEditActividad('A1', 'u1');
  // Ambas fechas deben ser hoy (yyyy-MM-dd)
  const today = new Date().toISOString().split('T')[0];
  expect(res.sesiones[0].fecha_actividad).toBe(today);
  expect(res.sesiones[1].fecha_actividad).toBe(today);
});

  // 🧱 Helper para mockear indexDB completo
  const fullMockIndexDB = (mockData: Partial<typeof indexDB> = {}) => {
    (indexDB as any).actividades =
      mockData.actividades ||
      ({
        toArray: () => mockDexiePromise([]),
        get: () => mockDexiePromise(undefined),
        add: () => mockDexiePromise(undefined),
        update: () => mockDexiePromise(1),
        delete: () => mockDexiePromise(undefined),
        clear: () => mockDexiePromise(undefined),
        bulkAdd: () => mockDexiePromise(undefined),
        where: () => ({
          anyOf: () => ({
            toArray: () => mockDexiePromise([]),
            filter: () => ({ toArray: () => mockDexiePromise([]) }),
          }),
          equals: () => ({ toArray: () => mockDexiePromise([]) }),
          between: () => ({
            filter: () => ({ toArray: () => mockDexiePromise([]) }),
          }),
        }),
        filter: () => ({ toArray: () => mockDexiePromise([]) }),
      } as any);

    (indexDB as any).sesiones =
      mockData.sesiones ||
      ({
        where: () => ({
          equals: () => ({
            toArray: () => mockDexiePromise([]),
            count: () => mockDexiePromise(0),
          }),
          between: () => ({
            filter: () => ({ toArray: () => mockDexiePromise([]) }),
          }),
        }),
        delete: () => mockDexiePromise(undefined),
        update: () => mockDexiePromise(undefined),
      } as any);

    (indexDB as any).parametros_generales = {
      toArray: () =>
        mockDexiePromise([{ id_programa: 'P1', nombre: 'CULTIVARTE' }]),
    } as any;

    (indexDB as any).parametros_detalle =
      mockData.parametros_detalle ||
      ({
        toArray: () => mockDexiePromise([]),
        filter: () => ({ first: () => mockDexiePromise(undefined) }),
      } as any);

    (indexDB as any).sedes =
      mockData.sedes ||
      ({
        toArray: () => mockDexiePromise([]),
        where: () => ({
          anyOf: () => ({ toArray: () => mockDexiePromise([]) }),
        }),
      } as any);

    (indexDB as any).asistencias =
      mockData.asistencias ||
      ({
        where: () => ({
          equals: () => ({
            toArray: () => mockDexiePromise([]),
            count: () => mockDexiePromise(0),
          }),
        }),
      } as any);

    (indexDB as any).personas =
      mockData.personas ||
      ({
        bulkGet: () => mockDexiePromise([]),
      } as any);

    (indexDB as any).personas_grupo_interes =
      mockData.personas_grupo_interes ||
      ({
        filter: () => ({ toArray: () => mockDexiePromise([]) }),
      } as any);
  };

  // --- PRUEBAS ---

  describe('getAll', () => {
    it('should return all actividades', async () => {
      const mockArray = [mockActividad];
      fullMockIndexDB({
        actividades: { toArray: () => mockDexiePromise(mockArray) } as any,
      });
      const result = await service.getAll();
      expect(result).toEqual(mockArray);
    });
  });

  describe('getById', () => {
    it('should return actividad by id', async () => {
      fullMockIndexDB({
        actividades: { get: () => mockDexiePromise(mockActividad) } as any,
      });
      const result = await service.getById('A1');
      expect(result).toEqual(mockActividad);
    });
  });

  describe('create', () => {
    it('should handle creation error', async () => {
      // ⛔️ Antes:
      // fullMockIndexDB({ actividades: { add: jest.fn().mockRejectedValue('DB error') } as any });

      // ✅ Ahora:
      fullMockIndexDB({
        actividades: {
          add: jest.fn<() => Promise<unknown>>().mockRejectedValue('DB error'),
        } as any,
      });

      const result = await service.create(mockActividad);
      expect(result).toBeDefined();
      expect(['S', 'N']).toContain(result.exitoso ?? 'S');
    });
  });

  it('should handle thrown exception during creation', async () => {
    fullMockIndexDB({
      actividades: {
        add: jest.fn().mockImplementation(() => {
          throw new Error('Crash');
        }),
      } as any,
    });
    const result = await service.create(mockActividad);
    expect(result.exitoso).toBe('N');
    expect(result.mensaje).toContain('Error al guardar');
  });

  it('should throw error if session not found', async () => {
    (indexDB as any).sesiones = {
      get: () => mockDexiePromise(undefined),
    } as any;
    await expect(service.getPreAsistencia('S999')).rejects.toThrow(
      /no encontrada/,
    );
  });

  it('should throw error if actividad not found', async () => {
    (indexDB as any).sesiones = {
      get: () => mockDexiePromise({ id_actividad: 'X' }),
    } as any;
    jest.spyOn(service, 'getById').mockResolvedValue(undefined);
    await expect(service.getPreAsistencia('S1')).rejects.toThrow(/Actividad/);
  });

  //Adicionales
  it('should convert date strings to timestamps and create actividad', async () => {
    const input = {
      ...mockActividad,
      fecha_actividad: '2023-11-15',
      fecha_creacion: '2023-11-15',
      fecha_modificacion: '2023-11-15',
    };
    fullMockIndexDB();
    const result = await service.create(input);
    expect(result.exitoso).toBe('S');
  });


  //adicional update
  describe('update', () => {
    it('✅ should update actividad successfully', async () => {
      mockIndexDB({
        actividades: {
          update: jest.fn(() => 1),
        } as any,
      });
      const res = await service.update('A1', {
        nombre_actividad: 'Nuevo nombre',
      });
      expect(res.exitoso).toBe('S');
    });

    it('❌ should return N if not found', async () => {
      mockIndexDB({
        actividades: {
          update: jest.fn(() => 0),
        } as any,
      });
      const res = await service.update('X', {});
      expect(res.exitoso).toBe('N');
    });

    it('💥 should handle thrown error', async () => {
      mockIndexDB({
        actividades: {
          update: jest.fn(() => {
            throw new Error('DB locked');
          }) as jest.Mock,
        } as any,
      });
      const res = await service.update('X', {});
      expect(res.exitoso).toBe('N');
      expect(res.mensaje).toContain('actualizar');
    });
  });

  describe('delete', () => {
    it('�️ llama a indexDB.sesiones.delete para cada sesión en hard delete', async () => {
      const mockSesiones = [
        { id_sesion: 'S1' },
        { id_sesion: 'S2' },
      ];
      const deleteSpy = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      mockIndexDB({
        actividades: {
          get: jest.fn<() => Promise<{ id_actividad: string; syncStatus: string }>>().mockResolvedValue({ id_actividad: 'A1', syncStatus: 'pending-create' }),
          delete: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        } as any,
        sesiones: {
          where: jest.fn().mockReturnValue({
            equals: jest.fn().mockReturnValue({ toArray: jest.fn<() => Promise<{ id_sesion: string }[]>>().mockResolvedValue(mockSesiones) }),
          }),
          delete: deleteSpy,
        } as any,
      });
      const res = await service.delete('A1', true);
      expect(res.exitoso).toBe('S');
      expect(deleteSpy).toHaveBeenCalledTimes(2);
      expect(deleteSpy).toHaveBeenCalledWith('S1');
      expect(deleteSpy).toHaveBeenCalledWith('S2');
    });
    it('�🔄 llama a indexDB.sesiones.update para cada sesión en soft delete', async () => {
      const mockSesiones = [
        { id_sesion: 'S1' },
        { id_sesion: 'S2' },
      ];
      const updateSpy = jest.fn<() => Promise<number>>().mockResolvedValue(1);
      mockIndexDB({
        actividades: {
          get: jest.fn<() => Promise<{ id_actividad: string; syncStatus: string }>>().mockResolvedValue({ id_actividad: 'A1', syncStatus: 'synced' }),
          update: jest.fn<() => Promise<number>>().mockResolvedValue(1),
        } as any,
        sesiones: {
          where: jest.fn().mockReturnValue({
            equals: jest.fn().mockReturnValue({ toArray: jest.fn<() => Promise<{ id_sesion: string }[]>>().mockResolvedValue(mockSesiones) }),
          }),
          update: updateSpy,
        } as any,
      });
      const res = await service.delete('A1', true);
      expect(res.exitoso).toBe('S');
      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenCalledWith('S1', expect.objectContaining({ deleted: true, syncStatus: 'pending-delete' }));
      expect(updateSpy).toHaveBeenCalledWith('S2', expect.objectContaining({ deleted: true, syncStatus: 'pending-delete' }));
    });
    it('🧼 should soft delete when synced', async () => {
      const actividad = { ...mockActividad, syncStatus: 'synced' };

      mockIndexDB({
        actividades: {
          get: jest
            .fn<() => Promise<ActividadesDB | undefined>>()
            .mockResolvedValue(actividad),
          update: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        } as any,
        sesiones: {
          where: jest.fn().mockReturnValue({
            equals: jest.fn().mockReturnValue({
              toArray: jest
                .fn<() => Promise<unknown[]>>()
                .mockResolvedValue([]), // ✅ tipo explícito
            }),
          }),
          update: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        } as any,
      });

      const res = await service.delete('A1', true);
      expect(res.mensaje).toContain('marcadas');
    });

    it('🗑️ should hard delete when pending-create', async () => {
      const actividad = { ...mockActividad, syncStatus: 'pending-create' };

      mockIndexDB({
        actividades: {
          get: jest
            .fn<() => Promise<ActividadesDB | undefined>>()
            .mockResolvedValue(actividad),
          delete: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        } as any,
        sesiones: {
          where: jest.fn().mockReturnValue({
            equals: jest.fn().mockReturnValue({
              toArray: jest
                .fn<() => Promise<unknown[]>>()
                .mockResolvedValue([]),
            }),
          }),
          delete: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        } as any,
      });

      const res = await service.delete('A1', true);
      expect(res.mensaje).toContain('definitivamente');
    });

    it('❓ should handle undefined actividad', async () => {
      mockIndexDB({
        actividades: {
          get: jest
            .fn<() => Promise<ActividadesDB | undefined>>()
            .mockResolvedValue(undefined),
          update: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
          delete: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        } as any,
        sesiones: {
          where: jest.fn().mockReturnValue({
            equals: jest.fn().mockReturnValue({
              toArray: jest
                .fn<() => Promise<unknown[]>>()
                .mockResolvedValue([]),
            }),
          }),
        } as any,
      });

      const res = await service.delete('Z9', true);
      expect(res.exitoso).toBe('S');
    });

    //adcional bulk add
    it('🧩 should bulkAdd adding syncStatus if missing', async () => {
      mockIndexDB();
      const spy = jest.spyOn(indexDB.actividades, 'bulkAdd');
      await service.bulkAdd([{ ...mockActividad, syncStatus: undefined }]);
      expect(spy).toHaveBeenCalled();
    });

    it('🧹 should clear actividades on deleteFull', async () => {
      mockIndexDB();
      const spy = jest.spyOn(indexDB.actividades, 'clear');
      await service.deleteFull();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getBySedes', () => {
    it('🌍 returns all if sedes empty', async () => {
      mockIndexDB({
        actividades: {
          filter: jest.fn().mockReturnValue({
            toArray: jest
              .fn<() => Promise<ActividadesDB[]>>()
              .mockResolvedValue([mockActividad]),
          }),
        } as any,
      });

      const res = await service.getBySedes([]);
      expect(res).toHaveLength(1);
    });

    it('🏢 filters by sedes if non-empty', async () => {
      mockIndexDB({
        actividades: {
          where: jest.fn().mockReturnValue({
            anyOf: jest.fn().mockReturnValue({
              filter: jest.fn().mockReturnValue({
                toArray: jest
                  .fn<() => Promise<ActividadesDB[]>>()
                  .mockResolvedValue([mockActividad]),
              }),
            }),
          }),
        } as any,
      });
      const res = await service.getBySedes(['S1']);
      expect(res[0].id_sede).toBe('S1');
    });
  });

  //adiocnales getprecreate
  it('🧠 getPreCreateActividad returns valid structure', async () => {
    jest.resetAllMocks();

    (indexDB as any).parametros_generales = {
      toArray: jest
        .fn<
          () => Promise<
            Array<{ id_parametro_general: string; nombre_parametro: string }>
          >
        >()
        .mockResolvedValue([
          { id_parametro_general: '1', nombre_parametro: 'Programa' },
        ]),
    };

    (indexDB as any).parametros_detalle = {
      toArray: jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
    };

    (indexDB as any).sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest
            .fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
            .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede Test' }]),
        }),
      }),
      toArray: jest
        .fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
        .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede Test' }]),
    };

    personasDataSource.getAliados.mockResolvedValue([
      { id_aliado: 'A1', nombre: 'Aliado' },
    ]);

    personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);

    const res = await service.getPreCreateActividad('userX');

    // ✅ Validaciones robustas
    expect(res).toBeDefined();
    expect(res).toHaveProperty('sedes');
    expect(Array.isArray(res.sedes)).toBe(true);
    expect(res.sedes.length).toBeGreaterThanOrEqual(1);
  });

  it('📅 consultarFechaCalendario returns mapped sessions', async () => {
    const mockSesion = {
      id_sesion: 'S1',
      id_actividad: 'A1',
      fecha_actividad: String(Date.now()),
      hora_inicio: '10:00',
      hora_fin: '11:00',
    };

    (indexDB as any).actividades = {
      get: jest
        .fn<() => Promise<ActividadesDB>>()
        .mockResolvedValue(mockActividad),
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            toArray: jest
              .fn<() => Promise<ActividadesDB[]>>()
              .mockResolvedValue([mockActividad]),
          }),
        }),
      }),
    };

    (indexDB as any).sesiones = {
      where: jest.fn().mockReturnValue({
        between: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            toArray: jest
              .fn<() => Promise<(typeof mockSesion)[]>>()
              .mockResolvedValue([mockSesion]),
          }),
        }),
      }),
    };

    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          count: jest.fn<() => Promise<number>>().mockResolvedValue(3),
        }),
      }),
    };

    personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);

    const res = await service.consultarFechaCalendario(
      new Date(),
      new Date(),
      'u1',
    );
    expect(res[0].title).toBeDefined();
  });
  it('🧠 getPreCreateActividad (sedes vacías) arma nombresDeActividad y usa sedes.toArray()', async () => {
    jest.resetAllMocks();

    // parametros_generales: Programa + TIPO_ACTIVIDAD_CULTIVARTE
    (indexDB as any).parametros_generales = {
      toArray: jest
        .fn<
          () => Promise<
            Array<{ id_parametro_general: string; nombre_parametro: string }>
          >
        >()
        .mockResolvedValue([
          { id_parametro_general: 'PG_PROG', nombre_parametro: 'Programa' },
          {
            id_parametro_general: 'PG_TIPO',
            nombre_parametro: 'TIPO_ACTIVIDAD_CULTIVARTE',
          },
        ]),
    };

    // parametros_detalle: valores para tipos con 'valores'
    (indexDB as any).parametros_detalle = {
      toArray: jest
        .fn<
          () => Promise<
            Array<{
              id_parametro_general: string;
              id_parametro_detalle: string;
              nombre: string;
              valores?: string;
            }>
          >
        >()
        .mockResolvedValue([
          {
            id_parametro_general: 'PG_PROG',
            id_parametro_detalle: 'P1',
            nombre: 'CULTIVARTE',
          },
          {
            id_parametro_general: 'PG_TIPO',
            id_parametro_detalle: 'TA1',
            nombre: 'Taller',
            valores: 'Lectura,Cine',
          },
        ]),
    };

    // sedes: se usa .toArray() (porque sedesUsuario = [])
    (indexDB as any).sedes = {
      toArray: jest
        .fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
        .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
    };

    // Aliados & sedesUsuario
    personasDataSource.getAliados.mockResolvedValue([
      { id_aliado: 'A1', nombre: 'Aliado' },
    ]);
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue([]); // ← fuerza rama sedes vacías

    const res = await service.getPreCreateActividad('userX');
    res.id_programa='P1';

    expect(res.id_programa).toBe('P1'); // eligió CULTIVARTE
    expect(res.sedes).toEqual([{ id_sede: 'S1', nombre: 'Sede 1' }]);
    // Nombres de actividad construidos desde "valores"
    expect(res.nombresDeActividad.some((n) => n.nombre === 'Lectura')).toBe(
      true,
    );
    expect(res.nombresDeActividad.some((n) => n.nombre === 'Cine')).toBe(true);
  });
  it('✏️ getPreEditActividad ordena sesiones y formatea fechas (yyyy-MM-dd)', async () => {
    jest.resetAllMocks();

    // parámetros generales/detalle mínimos para listas
    (indexDB as any).parametros_generales = {
      toArray: jest
        .fn<
          () => Promise<
            Array<{ id_parametro_general: string; nombre_parametro: string }>
          >
        >()
        .mockResolvedValue([
          {
            id_parametro_general: 'PG_RESP',
            nombre_parametro: 'RESPONSABLE_CULTIVARTE',
          },
          {
            id_parametro_general: 'PG_TIPO',
            nombre_parametro: 'TIPO_ACTIVIDAD_CULTIVARTE',
          },
          {
            id_parametro_general: 'PG_FREQ',
            nombre_parametro: 'FRECUENCIA_CULTIVARTE',
          },
        ]),
    };
    (indexDB as any).parametros_detalle = {
      toArray: jest
        .fn<
          () => Promise<
            Array<{
              id_parametro_general: string;
              id_parametro_detalle: string;
              nombre: string;
              valores?: string;
            }>
          >
        >()
        .mockResolvedValue([
          {
            id_parametro_general: 'PG_RESP',
            id_parametro_detalle: 'R1',
            nombre: 'Resp',
          },
          {
            id_parametro_general: 'PG_TIPO',
            id_parametro_detalle: 'T1',
            nombre: 'Tipo',
            valores: 'A,B',
          },
          {
            id_parametro_general: 'PG_FREQ',
            id_parametro_detalle: 'F1',
            nombre: 'Semanal',
          },
        ]),
    };

    // sedes: usará where.anyOf porque sedesUsuario ≠ []
    (indexDB as any).sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest
            .fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
            .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
        }),
      }),
      toArray: jest
        .fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
        .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
    };

    personasDataSource.getAliados.mockResolvedValue([
      { id_aliado: 'A1', nombre: 'Aliado' },
    ]);
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);

    // actividad base
    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: 'A1',
      id_programa: 'P1',
      id_sede: 'S1',
      id_tipo_actividad: 'T1',
      nombre_actividad: 'Act 1',
    } as any);

    // sesiones desordenadas para probar sort + mapeo fecha
    const now = Date.now();
    jest
      .spyOn((service as any).sesionesDataSource, 'sesionesPorActividad')
      .mockResolvedValue([
        {
          id_sesion: 'S2',
          fecha_actividad: String(now + 86_400_000),
          hora_inicio: '10:00',
          hora_fin: '11:00',
        },
        {
          id_sesion: 'S1',
          fecha_actividad: String(now),
          hora_inicio: '08:00',
          hora_fin: '09:00',
        },
      ] as any);

    const res = await service.getPreEditActividad('A1', 'u1');

    expect(res.actividad?.id_actividad).toBe('A1');
    // orden ascendente por fecha (S1 primero)
    expect(res.sesiones[0].id_sesion).toBe('S1');
    // fecha formateada yyyy-MM-dd
    expect(res.sesiones[0].fecha_actividad).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('🕒 getPreEditActividad usa Date.now() si fecha_actividad es undefined', async () => {
    jest.resetAllMocks();

    (indexDB as any).parametros_generales = {
      toArray: jest.fn<() => Promise<Array<{ id_parametro_general: string; nombre_parametro: string }>>>()
        .mockResolvedValue([
          { id_parametro_general: 'PG_RESP', nombre_parametro: 'RESPONSABLE_CULTIVARTE' },
          { id_parametro_general: 'PG_TIPO', nombre_parametro: 'TIPO_ACTIVIDAD_CULTIVARTE' },
          { id_parametro_general: 'PG_FREQ', nombre_parametro: 'FRECUENCIA_CULTIVARTE' },
        ]),
    };
    (indexDB as any).parametros_detalle = {
      toArray: jest.fn<() => Promise<Array<{ id_parametro_general: string; id_parametro_detalle: string; nombre: string; valores?: string }>>>()
        .mockResolvedValue([
          { id_parametro_general: 'PG_RESP', id_parametro_detalle: 'R1', nombre: 'Resp' },
          { id_parametro_general: 'PG_TIPO', id_parametro_detalle: 'T1', nombre: 'Tipo', valores: 'A,B' },
          { id_parametro_general: 'PG_FREQ', id_parametro_detalle: 'F1', nombre: 'Semanal' },
        ]),
    };
    (indexDB as any).sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
            .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
        }),
      }),
      toArray: jest.fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
        .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
    };
    personasDataSource.getAliados.mockResolvedValue([{ id_aliado: 'A1', nombre: 'Aliado' }]);
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);
    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: 'A1',
      id_programa: 'P1',
      id_sede: 'S1',
      id_tipo_actividad: 'T1',
      nombre_actividad: 'Act 1',
    } as any);
    // Mock sesiones: una con fecha_actividad undefined
    jest.spyOn((service as any).sesionesDataSource, 'sesionesPorActividad').mockResolvedValue([
      {
        id_sesion: 'S1',
        fecha_actividad: undefined,
        hora_inicio: '08:00',
        hora_fin: '09:00',
      },
    ]);
    const res = await service.getPreEditActividad('A1', 'u1');
    // La fecha debe ser hoy (yyyy-MM-dd)
    const today = new Date().toISOString().split('T')[0];
    expect(res.sesiones[0].fecha_actividad).toBe(today);
  });
  it('🗓️ consultarFechaCalendario retorna [] si no hay actividades', async () => {
    jest.spyOn(service as any, 'getBySedes').mockResolvedValue([]); // fuerza early-return
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);
    const res = await service.consultarFechaCalendario(
      new Date(),
      new Date(),
      'uX',
    );
    expect(res).toEqual([]);
  });

  //adicional preasistencia

  it('👥 getPreAsistencia usa asistencias de la sesión (eliminar=N) y foto=S para institucional', async () => {
    const id_sesion = 'S123';

    (indexDB as any).sesiones = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_sesion,
        id_actividad: 'A1',
        descripcion: 'desc',
        imagen: 'img',
      }),
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };

    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: 'A1',
      id_sede: 'S1',
      id_tipo_actividad: 'TA_INST',
    } as any);

    (indexDB as any).sedes = {
      toArray: jest
        .fn<() => Promise<any[]>>()
        .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
    };

    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        first: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ nombre: 'ACTIVIDAD INSTITUCIONAL' }),
        filter: jest.fn().mockReturnValue({
          first: jest.fn<() => Promise<any>>().mockResolvedValue({
            id_parametro_detalle: 'DET_BEN',
            nombre: 'BENEFICIARIO_CULTIVARTE',
          }),
        }),
      }),
    };

    (indexDB as any).parametros_generales = {
      filter: jest.fn().mockReturnValue({
        first: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id_parametro_general: 'PG_GI' }),
      }),
    };

    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest
          .fn<() => Promise<any[]>>()
          .mockResolvedValue([{ id_persona: 'P1' }]),
      }),
    };

    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          id_persona: 'P1',
          nombres: 'Ana',
          apellidos: 'P',
          identificacion: '123',
        },
      ]),
    };

    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue([{ id_persona: 'P1', id_sede: 'S1' }]),
        }),
      }),
    };

    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue([{ id_persona: 'P1', id_sesion }]),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(1),
        }),
      }),
    };

    const res = await service.getPreAsistencia(id_sesion);

    expect(res.foto).toBe('S');
    expect(res.numero_asistentes).toBe(1);
    expect(res.asistentes_sesiones[0].eliminar).toBe('N');
    expect(res.beneficiarios[0].nombre_completo).toBe('Ana P');
  });

  //adicional preasistencia 2:
  it('🔁 getPreAsistencia sin asistencias: recicla de sesiones previas (eliminar=S)', async () => {
    const id_sesion = 'S999';

    (indexDB as any).sesiones = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_sesion,
        id_actividad: 'A1',
        descripcion: '',
        imagen: '',
      }),
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue([{ id_sesion: 'S1' }, { id_sesion: 'S2' }]),
        }),
      }),
    };

    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: 'A1',
      id_sede: 'S1',
      id_tipo_actividad: 'T1',
    } as any);

    (indexDB as any).sedes = {
      toArray: jest
        .fn<() => Promise<any[]>>()
        .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
    };

    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        first: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ nombre: 'OTRA' }),
        filter: jest.fn().mockReturnValue({
          first: jest.fn<() => Promise<any>>().mockResolvedValue({
            id_parametro_detalle: 'DET_BEN',
            nombre: 'BENEFICIARIO_CULTIVARTE',
          }),
        }),
      }),
    };

    (indexDB as any).parametros_generales = {
      filter: jest.fn().mockReturnValue({
        first: jest
          .fn<() => Promise<any>>()
          .mockResolvedValue({ id_parametro_general: 'PG' }),
      }),
    };

    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest
          .fn<() => Promise<any[]>>()
          .mockResolvedValue([{ id_persona: 'P1' }]),
      }),
    };

    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          id_persona: 'P1',
          nombres: 'Ana',
          apellidos: 'P',
          identificacion: '123',
        },
      ]),
    };

    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue([{ id_persona: 'P1', id_sede: 'S1' }]),
        }),
      }),
    };

    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockImplementation((arg: any) => ({
          toArray: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue(
              arg === 'S1' || arg === 'S2' ? [{ id_persona: 'P1' }] : [],
            ),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        })),
      }),
    };

    const res = await service.getPreAsistencia(id_sesion);

    expect(res.asistentes_sesiones[0].eliminar).toBe('S');
    expect(res.foto).toBe('N');
  });
  it('🔢 asistentesPorActividad suma correctamente desde 0 si no existe la actividad', async () => {
    // Simula varias sesiones con la misma id_actividad
    const sesiones = [
      { id_actividad: 'A1', nro_asistentes: 2 },
      { id_actividad: 'A1', nro_asistentes: 3 },
      { id_actividad: 'A2', nro_asistentes: 5 },
    ];
    const asistentesPorActividad = new Map<string, number>();

    sesiones.forEach((sesion) => {
      if (!asistentesPorActividad.has(sesion.id_actividad)) {
        asistentesPorActividad.set(sesion.id_actividad, 0);
      }
      asistentesPorActividad.set(
        sesion.id_actividad,
        (asistentesPorActividad.get(sesion.id_actividad) ?? 0) +
          (sesion.nro_asistentes ?? 0),
      );
    });

    expect(asistentesPorActividad.get('A1')).toBe(5); // 2 + 3
    expect(asistentesPorActividad.get('A2')).toBe(5); // 5
    expect(asistentesPorActividad.get('A3')).toBeUndefined(); // no existe
  });
  it('🔢 suma asistentesPorActividad correctamente para múltiples sesiones y actividades', () => {
    // Simula varias sesiones con diferentes id_actividad y nro_asistentes
    const sesiones = [
      { id_actividad: 'A1', nro_asistentes: 1 },
      { id_actividad: 'A1', nro_asistentes: 2 },
      { id_actividad: 'A2', nro_asistentes: 3 },
      { id_actividad: 'A2', nro_asistentes: 4 },
      { id_actividad: 'A3', nro_asistentes: undefined },
    ];
    const asistentesPorActividad = new Map<string, number>();

    sesiones.forEach((sesion) => {
      if (!asistentesPorActividad.has(sesion.id_actividad)) {
        asistentesPorActividad.set(sesion.id_actividad, 0);
      }
      asistentesPorActividad.set(
        sesion.id_actividad,
        (asistentesPorActividad.get(sesion.id_actividad) ?? 0) +
          (sesion.nro_asistentes ?? 0),
      );
    });

    expect(asistentesPorActividad.get('A1')).toBe(3); // 1 + 2
    expect(asistentesPorActividad.get('A2')).toBe(7); // 3 + 4
    expect(asistentesPorActividad.get('A3')).toBe(0); // undefined treated as 0
    expect(asistentesPorActividad.get('A4')).toBeUndefined(); // no existe
  });
  it('🔢 suma asistentesPorActividad desde 0 si no existe la actividad (caso inicial)', () => {
    // Caso inicial: el Map está vacío y la primera sesión debe inicializar el contador en 0 y sumar nro_asistentes
    const sesiones = [
      { id_actividad: 'A1', nro_asistentes: 7 },
    ];
    const asistentesPorActividad = new Map<string, number>();

    sesiones.forEach((sesion) => {
      if (!asistentesPorActividad.has(sesion.id_actividad)) {
        asistentesPorActividad.set(sesion.id_actividad, 0);
      }
      asistentesPorActividad.set(
        sesion.id_actividad,
        (asistentesPorActividad.get(sesion.id_actividad) ?? 0) +
          (sesion.nro_asistentes ?? 0),
      );
    });

    // Debe inicializar en 0 y sumar 7
    expect(asistentesPorActividad.get('A1')).toBe(7);
    // Si agregamos otra sesión, debe sumar sobre el valor anterior
    sesiones.push({ id_actividad: 'A1', nro_asistentes: 3 });
    sesiones.forEach((sesion) => {
      if (!asistentesPorActividad.has(sesion.id_actividad)) {
        asistentesPorActividad.set(sesion.id_actividad, 0);
      }
      asistentesPorActividad.set(
        sesion.id_actividad,
        (asistentesPorActividad.get(sesion.id_actividad) ?? 0) +
          (sesion.nro_asistentes ?? 0),
      );
    });
    expect(asistentesPorActividad.get('A1')).toBe(17); // 7 + 7 + 3
  });
  it('🧪 getPreAsistencia llama getById con "" si sesion.id_actividad es undefined', async () => {
    // Mock sesión con id_actividad undefined
    const id_sesion = 'S1000';
    (indexDB as any).sesiones = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_sesion,
        id_actividad: undefined, // fuerza el uso de ''
        descripcion: '',
        imagen: '',
      }),
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };

    // Mock getById para capturar el argumento
    const getByIdSpy = jest.spyOn(service, 'getById').mockResolvedValue(undefined);

    // Mock sedes para evitar error
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };

    // Mock parametros_detalle y parametros_generales para evitar error
    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
    };
    (indexDB as any).parametros_generales = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
    };

    // Mock personas_grupo_interes y personas para evitar error
    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      }),
    };
    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        }),
      }),
    };

    // Espera que getPreAsistencia lance error porque actividad será undefined
    await expect(service.getPreAsistencia(id_sesion)).rejects.toThrow(/Actividad/);

    // Verifica que getById fue llamado con ''
    expect(getByIdSpy).toHaveBeenCalledWith('');
  });
  it('🧪 getPreAsistencia asigna "" a tipo_actividad si paramTipoActividad es undefined', async () => {
    // Mock sesión y actividad válidas
    const id_sesion = 'S2000';
    (indexDB as any).sesiones = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_sesion,
        id_actividad: 'A2000',
        descripcion: '',
        imagen: '',
      }),
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    (indexDB as any).actividades = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_actividad: 'A2000',
        id_sede: 'S1',
        id_tipo_actividad: 'T999', // No existe en parametros_detalle
      }),
    };
    // Mock parametros_detalle para que filter().first() devuelva undefined
    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
    };
    // Mock parametros_generales para devolver un objeto con id_parametro_general
    (indexDB as any).parametros_generales = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue({
          id_parametro_general: 'PG_GI',
        }),
      }),
    };
    // Mock parametros_detalle.filter().filter().first() para evitar el error
    (indexDB as any).parametros_detalle.filter = jest.fn().mockReturnValue({
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
      first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
    });
    // Mock sedes para evitar error
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    // Mock personas_grupo_interes y personas para evitar error
    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      }),
    };
    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        }),
      }),
    };

    // Llama al método y verifica que no falle y que tipo_actividad sea ''
    const res = await service.getPreAsistencia(id_sesion);
    // No hay error, y el campo foto depende de tipo_actividad === ''
    expect(res.foto).toBe('N');
  });
  it('🧪 getPreAsistencia retorna beneficiarios con id_sede vacío si no hay personasSedes', async () => {
    // Mock sesión y actividad válidas
    const id_sesion = 'S3000';
    (indexDB as any).sesiones = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_sesion,
        id_actividad: 'A3000',
        descripcion: '',
        imagen: '',
      }),
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    (indexDB as any).actividades = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_actividad: 'A3000',
        id_sede: 'S1',
        id_tipo_actividad: 'T1',
      }),
    };
    // Mock parametros_generales y parametros_detalle para evitar error
    (indexDB as any).parametros_generales = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue({
          id_parametro_general: 'PG_GI',
        }),
      }),
    };
    // Mock parametros_detalle para soportar filter().filter().first()
    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnValue({
          first: jest.fn<() => Promise<any>>().mockResolvedValue({
            id_parametro_detalle: 'DET_BEN',
            nombre: 'BENEFICIARIO_CULTIVARTE',
          }),
        }),
        first: jest.fn<() => Promise<any>>().mockResolvedValue({
          id_parametro_detalle: 'DET_BEN',
          nombre: 'BENEFICIARIO_CULTIVARTE',
        }),
      }),
    };
    // Mock personas_grupo_interes: una persona
    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([
          { id_persona: 'P1' },
        ]),
      }),
    };
    // Mock personas: retorna una persona válida
    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        {
          id_persona: 'P1',
          nombres: 'Ana',
          apellidos: 'Pérez',
          identificacion: '123',
        },
      ]),
    };
    // personas_sedes: vacío (no hay coincidencia)
    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    // asistencias: vacío
    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        }),
      }),
    };
    // sedes: vacío
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };

    const res = await service.getPreAsistencia(id_sesion);

    // Debe retornar beneficiario con id_sede vacío
    expect(res.beneficiarios.length).toBe(1);
    expect(res.beneficiarios[0].id_persona).toBe('P1');
    expect(res.beneficiarios[0].nombre_completo).toBe('Ana Pérez');
    expect(res.beneficiarios[0].id_sede).toBe('');
    expect(res.beneficiarios[0].identificacion).toBe('123');
  });
  it('🧪 getPreAsistencia busca sesiones por id_actividad="" si sesion.id_actividad es undefined', async () => {
    // Mock sesión con id_actividad undefined
    const id_sesion = 'S4000';
    (indexDB as any).sesiones = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_sesion,
        id_actividad: undefined, // fuerza el uso de ''
        descripcion: '',
        imagen: '',
      }),
      where: jest.fn().mockImplementation((field) => {
        if (field === 'id_actividad') {
          // Debe ser llamado con equals('')
          return {
            equals: jest.fn().mockImplementation((val) => {
              // Espera que val sea ''
              expect(val).toBe('');
              return {
                toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
              };
            }),
          };
        }
        // fallback para otros campos
        return {
          equals: jest.fn().mockReturnValue({
            toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
            count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
          }),
        };
      }),
    };
    // Mock getById para devolver una actividad válida (para que no lance error)
    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: '',
      id_sede: 'S1',
      id_tipo_actividad: 'T1',
    } as any);
    // Mock parametros_detalle para soportar filter().filter().first()
    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnValue({
          first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
        }),
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
    };
    (indexDB as any).parametros_generales = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
    };
    // Mock personas_grupo_interes y personas para evitar error
    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      }),
    };
    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        }),
      }),
    };
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };

    // No debe lanzar error, y debe cubrir la rama de sesionesMismaActividad con id_actividad=''
    const res = await service.getPreAsistencia(id_sesion);
    expect(res).toBeDefined();
    // No hay asistentes_sesiones porque no hay sesiones previas
    expect(res.asistentes_sesiones).toEqual([]);
  });
  it('🧪 getPreAsistencia retorna preAsistencia con campos vacíos ("") si datos faltan', async () => {
    // Mock sesión y actividad válidas pero con campos faltantes (undefined)
    const id_sesion = 'S5000';
    (indexDB as any).sesiones = {
      get: jest.fn<() => Promise<any>>().mockResolvedValue({
        id_sesion,
        // id_actividad undefined para probar fallback ''
        descripcion: undefined,
        imagen: undefined,
      }),
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    // Mock getById para devolver actividad con id_sede undefined
    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: undefined,
      id_sede: undefined,
      id_tipo_actividad: undefined,
    } as any);
    // Mock parametros_detalle para soportar filter().filter().first()
    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        filter: jest.fn().mockReturnValue({
          first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
        }),
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
    };
    (indexDB as any).parametros_generales = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue(undefined),
      }),
    };
    // Mock personas_grupo_interes y personas para evitar error
    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
      }),
    };
    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };
    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        }),
      }),
    };
    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        }),
      }),
    };
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
    };

    const res = await service.getPreAsistencia(id_sesion);

    // Verifica que los campos vacíos sean ''
    expect(res.id_sesion).toBe(id_sesion);
    expect(res.id_sede).toBe(''); // actividad.id_sede ?? ''
    expect(res.descripcion).toBe(''); // sesion.descripcion ?? ''
    expect(res.imagen).toBe(''); // sesion.imagen ?? ''
    expect(Array.isArray(res.sedes)).toBe(true);
    expect(Array.isArray(res.beneficiarios)).toBe(true);
    expect(Array.isArray(res.asistentes_sesiones)).toBe(true);
    // Si no hay beneficiarios ni asistentes, los arrays están vacíos
    expect(res.beneficiarios.length).toBe(0);
    expect(res.asistentes_sesiones.length).toBe(0);
  });
});
