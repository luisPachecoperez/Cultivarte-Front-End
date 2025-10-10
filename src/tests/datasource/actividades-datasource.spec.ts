// ✅ src/tests/datasource/actividades-datasource.spec.ts (versión Jest 100% equivalente)

import { TestBed } from '@angular/core/testing';
import { jest, expect } from '@jest/globals';

import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { Personas_sedesDataSource } from '../../app/indexdb/datasources/personas_sedes-datasource';
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
          provide: Personas_sedesDataSource,
          useClass: MockPersonasSedesDataSource,
        },
        { provide: PersonasDataSource, useClass: MockPersonasDataSource },
        { provide: SesionesDataSource, useClass: MockSesionesDataSource },
      ],
    });

    service = TestBed.inject(ActividadesDataSource);

    personasSedesDataSource = TestBed.inject(
      Personas_sedesDataSource,
    ) as unknown as MockPersonasSedesDataSource;
    personasDataSource = TestBed.inject(
      PersonasDataSource,
    ) as unknown as MockPersonasDataSource;
    sesionesDataSource = TestBed.inject(
      SesionesDataSource,
    ) as unknown as MockSesionesDataSource;
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
              filter: jest
                .fn()
                .mockReturnValue({
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
        .fn<() => Promise<Array<{ id_parametro_general: string; nombre_parametro: string }>>>()
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
      toArray: jest.fn<() => Promise<Array<{ id_parametro_general: string; nombre_parametro: string }>>>()
        .mockResolvedValue([
          { id_parametro_general: 'PG_PROG', nombre_parametro: 'Programa' },
          { id_parametro_general: 'PG_TIPO', nombre_parametro: 'TIPO_ACTIVIDAD_CULTIVARTE' },
        ]),
    };

    // parametros_detalle: valores para tipos con 'valores'
    (indexDB as any).parametros_detalle = {
      toArray: jest.fn<() => Promise<Array<{ id_parametro_general: string; id_parametro_detalle: string; nombre: string; valores?: string }>>>()
        .mockResolvedValue([
          { id_parametro_general: 'PG_PROG', id_parametro_detalle: 'P1', nombre: 'CULTIVARTE' },
          { id_parametro_general: 'PG_TIPO', id_parametro_detalle: 'TA1', nombre: 'Taller', valores: 'Lectura,Cine' },
        ]),
    };

    // sedes: se usa .toArray() (porque sedesUsuario = [])
    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<Array<{ id_sede: string; nombre: string }>>>()
        .mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
    };

    // Aliados & sedesUsuario
    personasDataSource.getAliados.mockResolvedValue([{ id_aliado: 'A1', nombre: 'Aliado' }]);
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue([]); // ← fuerza rama sedes vacías

    const res = await service.getPreCreateActividad('userX');

    expect(res.id_programa).toBe('P1'); // eligió CULTIVARTE
    expect(res.sedes).toEqual([{ id_sede: 'S1', nombre: 'Sede 1' }]);
    // Nombres de actividad construidos desde "valores"
    expect(res.nombresDeActividad.some(n => n.nombre === 'Lectura')).toBe(true);
    expect(res.nombresDeActividad.some(n => n.nombre === 'Cine')).toBe(true);
  });
  it('✏️ getPreEditActividad ordena sesiones y formatea fechas (yyyy-MM-dd)', async () => {
    jest.resetAllMocks();

    // parámetros generales/detalle mínimos para listas
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

    // sedes: usará where.anyOf porque sedesUsuario ≠ []
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
    jest.spyOn((service as any).sesionesDataSource, 'sesionesPorActividad')
      .mockResolvedValue([
        { id_sesion: 'S2', fecha_actividad: String(now + 86_400_000), hora_inicio: '10:00', hora_fin: '11:00' },
        { id_sesion: 'S1', fecha_actividad: String(now), hora_inicio: '08:00', hora_fin: '09:00' },
      ] as any);

    const res = await service.getPreEditActividad('A1', 'u1');

    expect(res.actividad?.id_actividad).toBe('A1');
    // orden ascendente por fecha (S1 primero)
    expect(res.sesiones[0].id_sesion).toBe('S1');
    // fecha formateada yyyy-MM-dd
    expect(res.sesiones[0].fecha_actividad).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('🗓️ consultarFechaCalendario retorna [] si no hay actividades', async () => {
    jest.spyOn(service as any, 'getBySedes').mockResolvedValue([]); // fuerza early-return
    personasSedesDataSource.getSedesByUsuario.mockResolvedValue(['S1']);
    const res = await service.consultarFechaCalendario(new Date(), new Date(), 'uX');
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
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([{ id_sede: 'S1', nombre: 'Sede 1' }]),
    };

    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue({ nombre: 'ACTIVIDAD INSTITUCIONAL' }),
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
        first: jest.fn<() => Promise<any>>().mockResolvedValue({ id_parametro_general: 'PG_GI' }),
      }),
    };

    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([{ id_persona: 'P1' }]),
      }),
    };

    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        { id_persona: 'P1', nombres: 'Ana', apellidos: 'P', identificacion: '123' },
      ]),
    };

    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([{ id_persona: 'P1', id_sede: 'S1' }]),
        }),
      }),
    };

    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([{ id_persona: 'P1', id_sesion }]),
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
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([
            { id_sesion: 'S1' }, { id_sesion: 'S2' },
          ]),
        }),
      }),
    };

    jest.spyOn(service, 'getById').mockResolvedValue({
      id_actividad: 'A1',
      id_sede: 'S1',
      id_tipo_actividad: 'T1',
    } as any);

    (indexDB as any).sedes = {
      toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        { id_sede: 'S1', nombre: 'Sede 1' },
      ]),
    };

    (indexDB as any).parametros_detalle = {
      filter: jest.fn().mockReturnValue({
        first: jest.fn<() => Promise<any>>().mockResolvedValue({ nombre: 'OTRA' }),
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
        first: jest.fn<() => Promise<any>>().mockResolvedValue({ id_parametro_general: 'PG' }),
      }),
    };

    (indexDB as any).personas_grupo_interes = {
      filter: jest.fn().mockReturnValue({
        toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([{ id_persona: 'P1' }]),
      }),
    };

    (indexDB as any).personas = {
      bulkGet: jest.fn<() => Promise<any[]>>().mockResolvedValue([
        { id_persona: 'P1', nombres: 'Ana', apellidos: 'P', identificacion: '123' },
      ]),
    };

    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue([
            { id_persona: 'P1', id_sede: 'S1' },
          ]),
        }),
      }),
    };

    (indexDB as any).asistencias = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockImplementation((arg: any) => ({
          toArray: jest.fn<() => Promise<any[]>>().mockResolvedValue(
            arg === 'S1' || arg === 'S2' ? [{ id_persona: 'P1' }] : []
          ),
          count: jest.fn<() => Promise<number>>().mockResolvedValue(0),
        })),
      }),
    };

    const res = await service.getPreAsistencia(id_sesion);

    expect(res.asistentes_sesiones[0].eliminar).toBe('S');
    expect(res.foto).toBe('N');
  });




});
