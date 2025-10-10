import { TestBed } from '@angular/core/testing';
import { PersonasDataSource } from '../../app/indexdb/datasources/personas-datasource';
import { indexDB } from '../../app/indexdb/services/database.service';
import { PersonasDB } from '../../app/indexdb/interfaces/personas.interface';
import { Aliados } from '../../app/eventos/interfaces/lista-aliados.interface';

// 🧩 Utilidad para crear promesas simuladas Dexie
function mockDexiePromise<T>(value: T): any {
  const p = Promise.resolve(value);
  (p as any).timeout = () => Promise.resolve(value);
  return p;
}

describe('PersonasDataSource (Jest)', () => {
  let service: PersonasDataSource;

  const mockPersona: PersonasDB = {
    id_persona: 'P1',
    nombres: 'Juan',
    apellidos: 'Pérez',
    razon_social: '',
    syncStatus: 'synced',
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PersonasDataSource],
    });
    service = TestBed.inject(PersonasDataSource);

    (indexDB as any).personas = {
      toArray: jest.fn().mockReturnValue(mockDexiePromise([mockPersona])),
      get: jest.fn().mockReturnValue(mockDexiePromise(mockPersona)),
      bulkAdd: jest.fn().mockReturnValue(mockDexiePromise(undefined)),
      clear: jest.fn().mockReturnValue(mockDexiePromise(undefined)),
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn().mockReturnValue(mockDexiePromise([])),
        }),
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockReturnValue(mockDexiePromise([])),
        }),
      }),
    };
  });

  afterEach(() => jest.clearAllMocks());

  // ✅ getAll
  it('getAll debe devolver todas las personas', async () => {
    const result = await service.getAll();
    expect(result.length).toBe(1);
    expect(result[0].id_persona).toBe('P1');
  });

  // ✅ getById
  it('getById debe devolver la persona por id', async () => {
    const result = await service.getById('P1');
    expect(result?.nombres).toBe('Juan');
  });

  // ✅ bulkAdd agrega syncStatus si falta
  it('bulkAdd agrega syncStatus si no está definido', async () => {
    const data: PersonasDB[] = [{ id_persona: 'P2' } as any];
    const spy = jest.spyOn(indexDB.personas, 'bulkAdd');
    await service.bulkAdd(data);
    expect(spy).toHaveBeenCalled();
  });

  // ✅ deleteFull
  it('deleteFull debe limpiar todas las personas', async () => {
    const spy = jest.spyOn(indexDB.personas, 'clear');
    await service.deleteFull();
    expect(spy).toHaveBeenCalled();
  });

  // ==========================================================
  // 🧩 Escenarios para getAliados()
  // ==========================================================

  function setupAliadosMocks(opts: {
    sedesUsuario?: any[];
    paramGeneral?: any;
    paramDetalle?: any;
    personasGrupo?: any[];
    aliados?: any[];
    personasSedesAliados?: any[];
  }) {
    (indexDB as any).personas_sedes = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockReturnValue(mockDexiePromise(opts.sedesUsuario ?? [])),
        }),
        anyOf: jest.fn().mockReturnValue({
          and: jest.fn().mockReturnValue({
            toArray: jest.fn().mockReturnValue(mockDexiePromise(opts.personasSedesAliados ?? [])),
          }),
        }),
      }),
    };

    (indexDB as any).parametros_generales = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          first: jest.fn().mockReturnValue(mockDexiePromise(opts.paramGeneral)),
        }),
      }),
    };

    (indexDB as any).parametros_detalle = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          filter: jest.fn().mockReturnValue({
            first: jest.fn().mockReturnValue(mockDexiePromise(opts.paramDetalle)),
          }),
        }),
      }),
    };

    (indexDB as any).personas_grupo_interes = {
      where: jest.fn().mockReturnValue({
        equals: jest.fn().mockReturnValue({
          toArray: jest.fn().mockReturnValue(mockDexiePromise(opts.personasGrupo ?? [])),
        }),
      }),
    };

    (indexDB as any).personas = {
      where: jest.fn().mockReturnValue({
        anyOf: jest.fn().mockReturnValue({
          toArray: jest.fn().mockReturnValue(mockDexiePromise(opts.aliados ?? [])),
        }),
      }),
    };
  }

  // ⚙️ Caso 1: Falta parametro general
  it('getAliados retorna [] si no hay parametro general', async () => {
    setupAliadosMocks({
      sedesUsuario: [],
      paramGeneral: null,
    });
    const result = await service.getAliados('U1');
    expect(result).toEqual([]);
  });

  // ⚙️ Caso 2: Falta parametro detalle
  it('getAliados retorna [] si no hay parametro detalle', async () => {
    setupAliadosMocks({
      sedesUsuario: [],
      paramGeneral: { id_parametro_general: 'PG1' },
      paramDetalle: null,
    });
    const result = await service.getAliados('U1');
    expect(result).toEqual([]);
  });

  // ⚙️ Caso 3: Usuario sin sedes → retorna todos los aliados
  it('getAliados retorna todos los aliados si usuario no tiene sedes', async () => {
    setupAliadosMocks({
      sedesUsuario: [],
      paramGeneral: { id_parametro_general: 'PG1' },
      paramDetalle: { id_parametro_detalle: 'PD1', nombre: 'ALIADO_CULTIVARTE' },
      personasGrupo: [{ id_persona: 'A1', id_grupo_interes: 'PD1' }],
      aliados: [{ id_persona: 'A1', nombres: 'Mario', apellidos: 'Lopez' }],
    });

    const result: Aliados[] = await service.getAliados('U1');
    expect(result.length).toBe(1);
    expect(result[0].nombre).toContain('Mario');
  });

  // ⚙️ Caso 4: Usuario con sedes → filtra por sede
  it('getAliados filtra aliados por sedes del usuario', async () => {
    setupAliadosMocks({
      sedesUsuario: [{ id_persona: 'U1', id_sede: 'S1' }],
      paramGeneral: { id_parametro_general: 'PG1' },
      paramDetalle: { id_parametro_detalle: 'PD1', nombre: 'ALIADO_CULTIVARTE' },
      personasGrupo: [{ id_persona: 'A1', id_grupo_interes: 'PD1' }],
      aliados: [{ id_persona: 'A1', nombres: 'Carlos', apellidos: 'Aliado' }],
      personasSedesAliados: [{ id_persona: 'A1', id_sede: 'S1' }],
    });

    const result = await service.getAliados('U1');
    expect(result.length).toBe(1);
    expect(result[0].id_aliado).toBe('A1');
    expect(result[0].nombre).toContain('Carlos');
  });

  // ⚙️ Caso 5: Aliado sin coincidencia de sede → retorna []
  it('getAliados retorna [] si aliados no coinciden en sedes', async () => {
    setupAliadosMocks({
      sedesUsuario: [{ id_persona: 'U1', id_sede: 'S1' }],
      paramGeneral: { id_parametro_general: 'PG1' },
      paramDetalle: { id_parametro_detalle: 'PD1', nombre: 'ALIADO_CULTIVARTE' },
      personasGrupo: [{ id_persona: 'A1', id_grupo_interes: 'PD1' }],
      aliados: [{ id_persona: 'A1', nombres: 'Pedro' }],
      personasSedesAliados: [{ id_persona: 'A1', id_sede: 'S2' }], // sede distinta
    });

    const result = await service.getAliados('U1');
    expect(result).toEqual([]);
  });
});
