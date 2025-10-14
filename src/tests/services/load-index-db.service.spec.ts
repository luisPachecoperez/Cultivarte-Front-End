// ✅ src/tests/services/load-index-db.service.spec.ts (versión Jest)
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { DatabaseService } from '../../app/indexdb/services/database.service';

// DataSources mocks
import { Parametros_generalesDataSource } from '../../app/indexdb/datasources/parametros_generales-datasource';
import { Parametros_detalleDataSource } from '../../app/indexdb/datasources/parametros_detalle-datasource';
import { PersonasDataSource } from '../../app/indexdb/datasources/personas-datasource';
import { PoblacionesDataSource } from '../../app/indexdb/datasources/poblaciones-datasource';
import { SedesDataSource } from '../../app/indexdb/datasources/sedes-datasource';
import { Personas_sedesDataSource } from '../../app/indexdb/datasources/personas_sedes-datasource';
import { Personas_programasDataSource } from '../../app/indexdb/datasources/personas_programas-datasource';
import { Personas_grupo_interesDataSource } from '../../app/indexdb/datasources/personas_grupo_interes-datasource';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';

// === Mocks ===
class GraphQLServiceMock {
  query = jest.fn();
}
const persona = {
  id_persona: 1,
  nombres: 'Orli',
  apellidos: 'Vasquez',
};

const personaSede = {
  id_personas_sede: 10,
  id_persona: 1,
  id_sede: 5,
};

const personaPrograma = {
  id_persona_programa: 100,
  id_persona: 1,
  id_programa: 7,
};

const asistencia = {
  id_asistencia: 200,
  id_persona: 1,
  id_sede: 5,
  fecha: '2025-10-13',
};
const graphqlServiceMock = new GraphQLServiceMock();
const graphql = new GraphQLServiceMock();

graphqlServiceMock.query
  .mockReturnValueOnce(of({ getPersonas: [persona] }))
  .mockReturnValueOnce(of({ getPersonasSedes: [personaSede] }))
  .mockReturnValueOnce(of({ getPersonaProgramas: [personaPrograma] }))
  .mockReturnValueOnce(of({ getAsistenciasSede: [asistencia] }));

const mkDS = () => ({
  bulkAdd: jest.fn().mockResolvedValue(undefined),
  deleteFull: jest.fn().mockResolvedValue(undefined),
});

class MockGraphQL {
  query = jest.fn();
}
class MockDatabaseService {}

// DataSource mocks con Jest
class MockDS {
  bulkAdd = jest.fn().mockResolvedValue(undefined);
  deleteFull = jest.fn().mockResolvedValue(undefined);
}

// === Helpers para crear objetos ===
const createParametrosGenerales = (override: Partial<any> = {}) => ({
  id_parametro_general: '1',
  nombre_parametro: 'test',
  descripcion: 'desc',
  estado: 'A',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  ...override,
});

const createParametrosDetalle = (override: Partial<any> = {}) => ({
  id_parametro_detalle: '1',
  id_parametro_general: '1',
  nombre: 'det',
  codigo: 'C1',
  orden: 1,
  valores: '',
  estado: 'A',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  ...override,
});

const createPoblacion = (override: Partial<any> = {}) => ({
  id_poblacion: '1',
  id_padre: '',
  nombre: 'Pob1',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  ...override,
});

const createSede = (override: Partial<any> = {}) => ({
  id_sede: '1',
  id_pais: 'CO',
  id_departamento: '11',
  id_ciudad: '11001',
  nombre: 'Sede1',
  numero_convenio: 'NC1',
  fecha_apertura_sede: '2020-01-01',
  matricula_inmobiliaria: 'MI1',
  id_creado_por: 'admin',
  fecha_creacion: '2020-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2020-01-01T00:00:00Z',
  estado: 'A',
  syncStatus: 'synced',
  ...override,
});

const createPersona = (override: Partial<any> = {}) => ({
  id_persona: '1',
  id_tipo_persona: '1',
  id_tipo_identificacion: '1',
  identificacion: '123',
  nombres: 'Juan',
  apellidos: 'Pérez',
  email: 'a@b.com',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  ...override,
});

const createPersonasSede = (override: Partial<any> = {}) => ({
  id_personas_sede: '1',
  id_persona: '1',
  id_sede: '1',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  deleted: false,
  ...override,
});

const createPersonasPrograma = (override: Partial<any> = {}) => ({
  id_persona_programa: '1',
  id_persona: '1',
  id_programa: 'P1',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  deleted: false,
  ...override,
});

const createPersonasGrupoInteres = (override: Partial<any> = {}) => ({
  id_personas_grupo_interes: '1',
  id_persona: '1',
  id_grupo_interes: 'GI1',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  deleted: false,
  ...override,
});

const createActividad = (override: Partial<any> = {}) => ({
  id_actividad: 'A1',
  id_programa: 'P1',
  nombre_actividad: 'Act1',
  descripcion: 'Desc',
  institucional: 'S',
  estado: 'A',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  ...override,
});

const createSesion = (override: Partial<any> = {}) => ({
  id_sesion: 'S1',
  id_actividad: 'A1',
  fecha_actividad: '2025-01-01',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  nro_asistentes: 10,
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  ...override,
});

const createAsistencia = (override: Partial<any> = {}) => ({
  id_asistencia: 'AS1',
  id_sesion: 'S1',
  id_persona: 'P1',
  id_creado_por: 'admin',
  fecha_creacion: new Date('2025-01-01T00:00:00Z'),
  id_modificado_por: 'admin',
  fecha_modificacion: new Date('2025-01-01T00:00:00Z'),
  syncStatus: 'synced',
  deleted: false,
  ...override,
});

describe('🧩 LoadIndexDBService (Jest)', () => {
  let service: LoadIndexDBService;
  let gql: jest.Mocked<MockGraphQL>;
  let graphqlService: jest.Mocked<GraphQLService>;

  let pgDS: MockDS;
  let pdDS: MockDS;
  let personasDS: MockDS;
  let poblacionesDS: MockDS;
  let sedesDS: MockDS;
  let personasSedesDS: MockDS;
  let personasProgramasDS: MockDS;
  let personasGrupoInteresDS: MockDS;
  let actividadesDS: MockDS;
  let asistenciasDS: MockDS;
  let sesionesDS: MockDS;

  const userId = 'user123';
  const graphqlMock = {
    query: jest.fn(),
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoadIndexDBService,
        { provide: GraphQLService, useValue: graphqlMock },

        { provide: GraphQLService, useClass: MockGraphQL },
        { provide: DatabaseService, useClass: MockDatabaseService },
        { provide: Parametros_generalesDataSource, useClass: MockDS },
        { provide: Parametros_detalleDataSource, useClass: MockDS },
        { provide: PersonasDataSource, useClass: MockDS },
        { provide: PoblacionesDataSource, useClass: MockDS },
        { provide: SedesDataSource, useClass: MockDS },
        { provide: Personas_sedesDataSource, useClass: MockDS },
        { provide: Personas_programasDataSource, useClass: MockDS },
        { provide: Personas_grupo_interesDataSource, useClass: MockDS },
        { provide: ActividadesDataSource, useClass: MockDS },
        { provide: AsistenciasDataSource, useClass: MockDS },
        { provide: SesionesDataSource, useClass: MockDS },
      ],
    });

    service = TestBed.inject(LoadIndexDBService);
    gql = TestBed.inject(GraphQLService) as any;
    graphqlService = TestBed.inject(
      GraphQLService,
    ) as jest.Mocked<GraphQLService>;
    pgDS = TestBed.inject(Parametros_generalesDataSource) as any;
    pdDS = TestBed.inject(Parametros_detalleDataSource) as any;
    personasDS = TestBed.inject(PersonasDataSource) as any;
    poblacionesDS = TestBed.inject(PoblacionesDataSource) as any;
    sedesDS = TestBed.inject(SedesDataSource) as any;
    personasSedesDS = TestBed.inject(Personas_sedesDataSource) as any;
    personasProgramasDS = TestBed.inject(Personas_programasDataSource) as any;
    personasGrupoInteresDS = TestBed.inject(
      Personas_grupo_interesDataSource,
    ) as any;
    actividadesDS = TestBed.inject(ActividadesDataSource) as any;
    asistenciasDS = TestBed.inject(AsistenciasDataSource) as any;
    sesionesDS = TestBed.inject(SesionesDataSource) as any;
  });

  // --- ping ---
  it('✅ ping devuelve "pong" en éxito', (done) => {
    gql.query.mockReturnValue(of({ ping: { ping: 'pong' } }));
    service.ping().subscribe((res) => {
      expect(res).toBe('pong');
      done();
    });
  });

  it('⚠️ ping maneja error HTTP', (done) => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
    });
    gql.query.mockReturnValue(throwError(() => error));
    service.ping().subscribe((res) => {
      expect(res).toContain('Server Error');
      done();
    });
  });

  // --- loadParametrosGenerales ---
  it('✅ loadParametrosGenerales carga datos', async () => {
    gql.query.mockReturnValue(
      of({ getParametrosGenerales: [createParametrosGenerales()] }),
    );
    await service.loadParametrosGenerales();
    expect(pgDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadParametrosDetalle ---
  it('✅ loadParametrosDetalle carga datos', async () => {
    gql.query.mockReturnValue(
      of({ getParametrosDetalle: [createParametrosDetalle()] }),
    );
    await service.loadParametrosDetalle();
    expect(pdDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPoblaciones ---
  it('✅ loadPoblaciones carga datos', async () => {
    gql.query.mockReturnValue(of({ getPoblaciones: [createPoblacion()] }));
    await service.loadPoblaciones();
    expect(poblacionesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadSedes ---
  it('✅ loadSedes carga datos', async () => {
    gql.query.mockReturnValue(of({ getSedes: [createSede()] }));
    await service.loadSedes();
    expect(sedesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPersonas ---
  it('✅ loadPersonas carga con paginación', async () => {
    let call = 0;
    gql.query.mockImplementation(() => {
      call++;
      return of({
        getPersonas:
          call === 1
            ? Array(2500).fill(createPersona())
            : [createPersona({ id_persona: '2' })],
      });
    });

    await service.loadPersonas();

    expect(personasDS.deleteFull).toHaveBeenCalled();
    expect(personasDS.bulkAdd).toHaveBeenCalledTimes(2);
    expect(gql.query).toHaveBeenCalledTimes(2);
  });

  // --- loadPersonasSedes ---
  it('✅ loadPersonasSedes carga con paginación', async () => {
    gql.query.mockReturnValue(of({ getPersonasSedes: [createPersonasSede()] }));
    await service.loadPersonasSedes();
    expect(personasSedesDS.deleteFull).toHaveBeenCalled();
    expect(personasSedesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPersonaProgramas ---
  it('✅ loadPersonaProgramas carga con paginación', async () => {
    gql.query.mockReturnValue(
      of({ getPersonaProgramas: [createPersonasPrograma()] }),
    );
    await service.loadPersonaProgramas();
    expect(personasProgramasDS.deleteFull).toHaveBeenCalled();
    expect(personasProgramasDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPersonasGrupoInteres ---
  it('✅ loadPersonasGrupoInteres carga con paginación', async () => {
    gql.query.mockReturnValue(
      of({ getPersonasGrupoInteres: [createPersonasGrupoInteres()] }),
    );
    await service.loadPersonasGrupoInteres();
    expect(personasGrupoInteresDS.deleteFull).toHaveBeenCalled();
    expect(personasGrupoInteresDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadActividadesSede ---
  it('✅ loadActividadesSede carga actividades por usuario', async () => {
    gql.query.mockReturnValue(of({ getActividadSedes: [createActividad()] }));
    await service.loadActividadesSede(userId);
    expect(actividadesDS.deleteFull).toHaveBeenCalled();
    expect(actividadesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadSesionesSede ---
  it('✅ loadSesionesSede carga sesiones por usuario', async () => {
    gql.query.mockReturnValue(of({ getSesionesSedes: [createSesion()] }));
    await service.loadSesionesSede(userId);
    expect(sesionesDS.deleteFull).toHaveBeenCalled();
    expect(sesionesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadAsistenciasSede ---
  it('✅ loadAsistenciasSede carga asistencias por usuario', async () => {
    gql.query.mockReturnValue(of({ getAsistenciasSede: [createAsistencia()] }));
    await service.loadAsistenciasSede(userId);
    expect(asistenciasDS.deleteFull).toHaveBeenCalled();
    expect(asistenciasDS.bulkAdd).toHaveBeenCalled();
  });

  // --- cargarDatosIniciales ---
  it('✅ cargarDatosIniciales ejecuta todo si ping = "pong"', async () => {
    gql.query.mockImplementation((query: string) =>
      query.includes('Ping')
        ? of({ ping: { ping: 'pong' } })
        : of({
            getParametrosGenerales: [],
            getParametrosDetalle: [],
            getPoblaciones: [],
            getSedes: [],
            getPersonas: [],
            getPersonasSedes: [],
            getPersonaProgramas: [],
            getPersonasGrupoInteres: [],
            getActividadSedes: [],
            getSesionesSedes: [],
            getAsistenciasSede: [],
          }),
    );

    const spy = jest
      .spyOn(service, 'loadParametrosGenerales')
      .mockResolvedValue(undefined);
    service.cargarDatosIniciales(userId);
    await new Promise((r) => setTimeout(r, 50));
    expect(spy).toHaveBeenCalled();
  });

  it('⚪ cargarDatosIniciales no carga si ping falla', async () => {
    gql.query.mockReturnValue(of({ ping: { ping: 'fail' } }));
    const spy = jest.spyOn(service, 'loadParametrosGenerales');
    service.cargarDatosIniciales(userId);
    await new Promise((r) => setTimeout(r, 50));
    expect(spy).not.toHaveBeenCalled();
  });

  it('🧠 loadActividadesSede repite bucle cuando data.length >= limit', async () => {
    const mockGraphQL = TestBed.inject(
      GraphQLService,
    ) as unknown as jest.Mocked<GraphQLService>;
    const mockDS = TestBed.inject(ActividadesDataSource);

    // Primera llamada devuelve data igual al límite (debe entrar al else)
    const actividades = Array(2500).fill({ id_actividad: 'A1' });

    jest
      .spyOn(mockGraphQL, 'query')
      .mockReturnValueOnce(of({ getActividadSedes: actividades } as any))
      // Segunda llamada devuelve menos datos → termina el while
      .mockReturnValueOnce(of({ getActividadSedes: [] } as any));

    jest.spyOn(mockDS, 'deleteFull').mockResolvedValue(undefined);
    jest.spyOn(mockDS, 'bulkAdd').mockResolvedValue(undefined);

    await TestBed.inject(LoadIndexDBService).loadActividadesSede('USR1');

    expect(mockGraphQL.query).toHaveBeenCalledTimes(2);
    expect(mockDS.bulkAdd).toHaveBeenCalledTimes(2);
  });
  it('🧠 loadAsistenciasSede ejecuta rama else cuando data.length >= limit', async () => {
    const mockGraphQL = TestBed.inject(
      GraphQLService,
    ) as unknown as jest.Mocked<GraphQLService>;

    const mockDS = TestBed.inject(AsistenciasDataSource);

    const asistencias = Array(2500).fill({ id_asistencia: 'X' });
    jest
      .spyOn(mockGraphQL, 'query')
      .mockReturnValueOnce(of({ getAsistenciasSede: asistencias } as any))
      .mockReturnValueOnce(of({ getAsistenciasSede: [] } as any));

    jest.spyOn(mockDS, 'deleteFull').mockResolvedValue(undefined);
    jest.spyOn(mockDS, 'bulkAdd').mockResolvedValue(undefined);

    await TestBed.inject(LoadIndexDBService).loadAsistenciasSede('USR1');

    expect(mockGraphQL.query).toHaveBeenCalledTimes(2);
  });
  it('🔴 cargarDatosIniciales captura error en pipeline', async () => {
    gql.query.mockImplementation(
      (query: string) =>
        query.includes('Ping')
          ? of({ ping: { ping: 'pong' } }) // ping OK
          : of({}), // se ejecutan las cargas
    );

    // Provocamos que falle un método interno dentro del switchMap
    const error = new Error('boom');
    jest.spyOn(service, 'loadParametrosGenerales').mockRejectedValueOnce(error);

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    service.cargarDatosIniciales('USR_ERR');

    await new Promise((r) => setTimeout(r, 100));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('❌ Error en cargarDatosIniciales:'),
      error,
    );

    consoleSpy.mockRestore();
  });

  it('⚪ loadSesionesSede sale del bucle al recibir lista vacía', async () => {
    gql.query.mockReturnValue(of({ getSesionesSedes: [] }));
    const sesionesDS = TestBed.inject(SesionesDataSource);
    await service.loadSesionesSede('USR1');
    expect(sesionesDS.bulkAdd).toHaveBeenCalledTimes(1);
  });
  it('⚠️ ping maneja error sin message', (done) => {
    gql.query.mockReturnValue(throwError(() => ({})));
    service.ping().subscribe((res) => {
      expect(res).toBeUndefined();
      done();
    });
  });
  it('🧩 loadPersonas ejecuta rama else cuando data.length >= limit', async () => {
    const mockGraphQL = TestBed.inject(GraphQLService) as any;
    const personasDS = TestBed.inject(PersonasDataSource) as any;
    const personas = Array(2500).fill({ id_persona: 'X' });

    jest
      .spyOn(mockGraphQL, 'query')
      .mockReturnValueOnce(of({ getPersonas: personas }))
      .mockReturnValueOnce(of({ getPersonas: [] }));

    jest.spyOn(personasDS, 'deleteFull').mockResolvedValue(undefined);
    jest.spyOn(personasDS, 'bulkAdd').mockResolvedValue(undefined);

    await service.loadPersonas();
    expect(mockGraphQL.query).toHaveBeenCalledTimes(2);
  });

  it('🧩 loadPersonasSedes ejecuta rama else cuando data.length >= limit', async () => {
    const mockGraphQL = TestBed.inject(GraphQLService) as any;
    const personasSedesDS = TestBed.inject(Personas_sedesDataSource) as any;
    const data = Array(2500).fill({ id_personas_sede: 'PS1' });

    jest
      .spyOn(mockGraphQL, 'query')
      .mockReturnValueOnce(of({ getPersonasSedes: data }))
      .mockReturnValueOnce(of({ getPersonasSedes: [] }));

    jest.spyOn(personasSedesDS, 'deleteFull').mockResolvedValue(undefined);
    jest.spyOn(personasSedesDS, 'bulkAdd').mockResolvedValue(undefined);

    await service.loadPersonasSedes();
    expect(mockGraphQL.query).toHaveBeenCalledTimes(2);
  });

  it('🧩 loadPersonaProgramas ejecuta rama else cuando data.length >= limit', async () => {
    const mockGraphQL = TestBed.inject(GraphQLService) as any;
    const personasProgramasDS = TestBed.inject(
      Personas_programasDataSource,
    ) as any;
    const data = Array(2500).fill({ id_persona_programa: 'PP1' });

    jest
      .spyOn(mockGraphQL, 'query')
      .mockReturnValueOnce(of({ getPersonaProgramas: data }))
      .mockReturnValueOnce(of({ getPersonaProgramas: [] }));

    jest.spyOn(personasProgramasDS, 'deleteFull').mockResolvedValue(undefined);
    jest.spyOn(personasProgramasDS, 'bulkAdd').mockResolvedValue(undefined);

    await service.loadPersonaProgramas();
    expect(mockGraphQL.query).toHaveBeenCalledTimes(2);
  });

  it('🧩 loadSesionesSede ejecuta rama else cuando data.length >= limit', async () => {
    const mockGraphQL = TestBed.inject(GraphQLService) as any;
    const sesionesDS = TestBed.inject(SesionesDataSource) as any;
    const data = Array(2500).fill({ id_sesion: 'S1' });

    jest
      .spyOn(mockGraphQL, 'query')
      .mockReturnValueOnce(of({ getSesionesSedes: data }))
      .mockReturnValueOnce(of({ getSesionesSedes: [] }));

    jest.spyOn(sesionesDS, 'deleteFull').mockResolvedValue(undefined);
    jest.spyOn(sesionesDS, 'bulkAdd').mockResolvedValue(undefined);

    await service.loadSesionesSede('USR1');
    expect(mockGraphQL.query).toHaveBeenCalledTimes(2);
  });

  it('🧠 loadPersonasGrupoInteres ejecuta rama else cuando data.length >= limit', async () => {
    const gql = TestBed.inject(GraphQLService) as any;
    const mockDS = TestBed.inject(Personas_grupo_interesDataSource) as any;

    // Datos igual al límite → entra al else → hace segunda vuelta
    const data = Array(25000).fill({ id_personas_grupo_interes: 'GI1' });

    jest
      .spyOn(gql, 'query')
      .mockReturnValueOnce(of({ getPersonasGrupoInteres: data }))
      .mockReturnValueOnce(of({ getPersonasGrupoInteres: [] }));

    jest.spyOn(mockDS, 'deleteFull').mockResolvedValue(undefined);
    jest.spyOn(mockDS, 'bulkAdd').mockResolvedValue(undefined);

    await service.loadPersonasGrupoInteres();

    expect(gql.query).toHaveBeenCalledTimes(2);
    expect(mockDS.bulkAdd).toHaveBeenCalledTimes(2);
  });
  it('⚪ loadPersonasGrupoInteres usa [] cuando response.getPersonasGrupoInteres es undefined', async () => {
    const gql = TestBed.inject(GraphQLService) as any;
    const ds = TestBed.inject(Personas_grupo_interesDataSource) as any;

    const bulkSpy = jest.spyOn(ds, 'bulkAdd');

    // sin propiedad -> dispara el lado "?? []"
    jest.spyOn(gql, 'query').mockReturnValueOnce(of({} as any));

    await service.loadPersonasGrupoInteres();

    expect(bulkSpy).toHaveBeenCalledTimes(1);
    expect(bulkSpy.mock.calls[0][0]).toEqual([]); // se insertó []
  });

  it('⚪ loadActividadesSede usa [] cuando response.getActividadSedes es undefined', async () => {
    const gql = TestBed.inject(GraphQLService) as any;
    const ds = TestBed.inject(ActividadesDataSource) as any;

    const bulkSpy = jest.spyOn(ds, 'bulkAdd');

    jest.spyOn(gql, 'query').mockReturnValueOnce(of({} as any));

    await service.loadActividadesSede('USR1');

    expect(bulkSpy).toHaveBeenCalledTimes(1);
    expect(bulkSpy.mock.calls[0][0]).toEqual([]); // rama nullish
  });
  it('⚪ loadSesionesSede usa [] cuando response.getSesionesSedes es undefined', async () => {
    const gql = TestBed.inject(GraphQLService) as any;
    const ds = TestBed.inject(SesionesDataSource) as any;

    const bulkSpy = jest.spyOn(ds, 'bulkAdd');

    jest.spyOn(gql, 'query').mockReturnValueOnce(of({} as any));

    await service.loadSesionesSede('USR1');

    expect(bulkSpy).toHaveBeenCalledTimes(1);
    expect(bulkSpy.mock.calls[0][0]).toEqual([]); // rama nullish
  });

  describe('LoadIndexDBService (branch coverage focalizado)', () => {
    let graphql: GraphQLServiceMock;

    // DataSources
    let parametrosGeneralesDS: ReturnType<typeof mkDS>;
    let parametrosDetalleDS: ReturnType<typeof mkDS>;
    let personasDS: ReturnType<typeof mkDS>;
    let poblacionesDS: ReturnType<typeof mkDS>;
    let sedesDS: ReturnType<typeof mkDS>;
    let personasSedesDS: ReturnType<typeof mkDS>;
    let personasProgramasDS: ReturnType<typeof mkDS>;
    let personasGrupoInteresDS: ReturnType<typeof mkDS>;
    let actividadesDS: ReturnType<typeof mkDS>;
    let asistenciasDS: ReturnType<typeof mkDS>;
    let sesionesDS: ReturnType<typeof mkDS>;

    // DatabaseService no se usa directamente en el código actual
    const db: any = {};

    let service: LoadIndexDBService;

    beforeEach(() => {
      graphql = new GraphQLServiceMock();

      parametrosGeneralesDS = mkDS();
      parametrosDetalleDS = mkDS();
      personasDS = mkDS();
      poblacionesDS = mkDS();
      sedesDS = mkDS();
      personasSedesDS = mkDS();
      personasProgramasDS = mkDS();
      personasGrupoInteresDS = mkDS();
      actividadesDS = mkDS();
      asistenciasDS = mkDS();
      sesionesDS = mkDS();

      service = new LoadIndexDBService(
        graphql as any,
        db,
        parametrosGeneralesDS as any,
        parametrosDetalleDS as any,
        personasDS as any,
        poblacionesDS as any,
        sedesDS as any,
        personasSedesDS as any,
        personasProgramasDS as any,
        personasGrupoInteresDS as any,
        actividadesDS as any,
        asistenciasDS as any,
        sesionesDS as any,
      );
    });

    // ---------- ping(): éxito y error ----------
    it('ping() mapea correctamente "pong"', async () => {
      graphql.query.mockReturnValueOnce(of({ ping: { ping: 'pong' } }));
      const v = await firstValueFrom(service.ping());
      expect(v).toBe('pong');
    });

    it('ping() retorna el message en catchError (HttpErrorResponse)', async () => {
      const httpErr = new HttpErrorResponse({
        status: 500,
        statusText: 'X',
        error: 'E',
        url: '/g',
      });
      graphql.query.mockReturnValueOnce(throwError(() => httpErr));
      const v = await firstValueFrom(service.ping());
      expect(typeof v).toBe('string');
      expect(v).toContain('Http failure');
    });

    // ---------- Ramas de arrays vacíos (?? []) ----------
    it('loadParametrosGenerales: maneja respuesta vacía (?? [])', async () => {
      graphql.query.mockReturnValueOnce(of({} as any));
      await service.loadParametrosGenerales();
      expect(parametrosGeneralesDS.bulkAdd).toHaveBeenCalledWith([]);
    });

    it('loadParametrosDetalle: maneja respuesta vacía (?? [])', async () => {
      graphql.query.mockReturnValueOnce(of({} as any));
      await service.loadParametrosDetalle();
      expect(parametrosDetalleDS.bulkAdd).toHaveBeenCalledWith([]);
    });

    it('loadPoblaciones: maneja respuesta vacía (?? [])', async () => {
      graphql.query.mockReturnValueOnce(of({} as any));
      await service.loadPoblaciones();
      expect(poblacionesDS.bulkAdd).toHaveBeenCalledWith([]);
    });

    it('loadSedes: maneja respuesta vacía (?? [])', async () => {
      graphql.query.mockReturnValueOnce(of({} as any));
      await service.loadSedes();
      expect(sedesDS.bulkAdd).toHaveBeenCalledWith([]);
    });

    // ---------- Paginación genérica helper ----------
    const mkPaged = (field: string, limit: number) => {
      // Primera página exactamente = limit para forzar segundo ciclo
      const page1 = {
        [field]: Array.from({ length: limit }).map((_, i) => ({
          id: `${field}-1-${i}`,
        })),
      } as any;
      // Segunda página < limit para cortar el while
      const page2 = {
        [field]: Array.from({ length: Math.max(1, Math.floor(limit / 4)) }).map(
          (_, i) => ({ id: `${field}-2-${i}` }),
        ),
      } as any;
      return [page1, page2];
    };

    // ---------- loadPersonas: dos páginas (hasMore true -> false) ----------
    it('loadPersonas: itera paginación hasta data.length < limit', async () => {
      const limit = 2500; // el servicio fija 2500 en constructor
      const [p1, p2] = mkPaged('getPersonas', limit);
      graphql.query
        .mockReturnValueOnce(of(p1)) // offset 0
        .mockReturnValueOnce(of(p2)); // offset 2500 -> corta

      await service.loadPersonas();

      expect(personasDS.deleteFull).toHaveBeenCalledTimes(1);
      expect(personasDS.bulkAdd).toHaveBeenCalledTimes(2);
      expect(personasDS.bulkAdd).toHaveBeenNthCalledWith(1, expect.any(Array));
      expect(personasDS.bulkAdd).toHaveBeenNthCalledWith(2, expect.any(Array));
    });

    it('loadPersonasSedes: cubre rama de paginación', async () => {
      const limit = 2500;
      const [p1, p2] = mkPaged('getPersonasSedes', limit);
      graphql.query.mockReturnValueOnce(of(p1)).mockReturnValueOnce(of(p2));

      await service.loadPersonasSedes();

      expect(personasSedesDS.deleteFull).toHaveBeenCalledTimes(1);
      expect(personasSedesDS.bulkAdd).toHaveBeenCalledTimes(2);
    });

    it('loadPersonaProgramas: cubre rama de paginación', async () => {
      const limit = 2500;
      const [p1, p2] = mkPaged('getPersonaProgramas', limit);
      graphql.query.mockReturnValueOnce(of(p1)).mockReturnValueOnce(of(p2));

      await service.loadPersonaProgramas();

      expect(personasProgramasDS.deleteFull).toHaveBeenCalledTimes(1);
      expect(personasProgramasDS.bulkAdd).toHaveBeenCalledTimes(2);
    });

    it('loadPersonasGrupoInteres: cubre rama de paginación', async () => {
      const limit = 2500;
      const [p1, p2] = mkPaged('getPersonasGrupoInteres', limit);
      graphql.query.mockReturnValueOnce(of(p1)).mockReturnValueOnce(of(p2));

      await service.loadPersonasGrupoInteres();

      expect(personasGrupoInteresDS.deleteFull).toHaveBeenCalledTimes(1);
      expect(personasGrupoInteresDS.bulkAdd).toHaveBeenCalledTimes(2);
    });

    it('loadSesionesSede: cubre rama de paginación (rango medio ~340)', async () => {
      const limit = 2500;
      const [p1, p2] = mkPaged('getSesionesSedes', limit);
      graphql.query.mockReturnValueOnce(of(p1)).mockReturnValueOnce(of(p2));

      await service.loadSesionesSede('USER-1');

      expect(sesionesDS.deleteFull).toHaveBeenCalledTimes(1);
      expect(sesionesDS.bulkAdd).toHaveBeenCalledTimes(2);
    });

    // (Opcional) Si necesitas cubrir también una de las otras colecciones por si el reporte sigue marcando huecos:
    it('loadAsistenciasSede: cubre rama de paginación', async () => {
      const limit = 2500;
      const [p1, p2] = mkPaged('getAsistenciasSede', limit);
      graphql.query.mockReturnValueOnce(of(p1)).mockReturnValueOnce(of(p2));

      await service.loadAsistenciasSede('USER-1');

      expect(asistenciasDS.deleteFull).toHaveBeenCalledTimes(1);
      expect(asistenciasDS.bulkAdd).toHaveBeenCalledTimes(2);
    });

    // ---------- Orquestador: cargarDatosIniciales ----------
    it('cargarDatosIniciales: con ping === "pong" llama todos los loaders', async () => {
      // Mockea ping() directo para no depender de GraphQL aquí
      jest.spyOn(service, 'ping').mockReturnValue(of('pong'));

      // Espías sobre cada loader para verificar llamadas
      const spies = [
        jest.spyOn(service, 'loadParametrosGenerales').mockResolvedValue(),
        jest.spyOn(service, 'loadParametrosDetalle').mockResolvedValue(),
        jest.spyOn(service, 'loadPoblaciones').mockResolvedValue(),
        jest.spyOn(service, 'loadSedes').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonas').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonasSedes').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonaProgramas').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonasGrupoInteres').mockResolvedValue(),
        jest.spyOn(service, 'loadActividadesSede').mockResolvedValue(),
        jest.spyOn(service, 'loadSesionesSede').mockResolvedValue(),
        jest.spyOn(service, 'loadAsistenciasSede').mockResolvedValue(),
      ];

      // Suscríbete (es void + subscribe interno). Espera a microtask queue.
      service.cargarDatosIniciales('USER-XYZ');
      await new Promise((r) => setTimeout(r, 0));

      spies.forEach((s) => expect(s).toHaveBeenCalled());
    });

    it('cargarDatosIniciales: con ping !== "pong" NO llama loaders', async () => {
      jest.spyOn(service, 'ping').mockReturnValue(of('no-pong'));

      const spies = [
        jest.spyOn(service, 'loadParametrosGenerales').mockResolvedValue(),
        jest.spyOn(service, 'loadParametrosDetalle').mockResolvedValue(),
        jest.spyOn(service, 'loadPoblaciones').mockResolvedValue(),
        jest.spyOn(service, 'loadSedes').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonas').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonasSedes').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonaProgramas').mockResolvedValue(),
        jest.spyOn(service, 'loadPersonasGrupoInteres').mockResolvedValue(),
        jest.spyOn(service, 'loadActividadesSede').mockResolvedValue(),
        jest.spyOn(service, 'loadSesionesSede').mockResolvedValue(),
        jest.spyOn(service, 'loadAsistenciasSede').mockResolvedValue(),
      ];

      service.cargarDatosIniciales('USER-XYZ');
      await new Promise((r) => setTimeout(r, 0));

      spies.forEach((s) => expect(s).not.toHaveBeenCalled());
    });

    it('cargarDatosIniciales: si un loader lanza, cae en catchError y no rompe el stream (console.error llamado)', async () => {
      jest.spyOn(service, 'ping').mockReturnValue(of('pong'));
      jest.spyOn(service, 'loadParametrosGenerales').mockResolvedValue();
      jest.spyOn(service, 'loadParametrosDetalle').mockResolvedValue();
      // Forzamos error en un loader intermedio:
      jest
        .spyOn(service, 'loadPoblaciones')
        .mockRejectedValue(new Error('boom'));
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      service.cargarDatosIniciales('USER-XYZ');
      await new Promise((r) => setTimeout(r, 0));

      expect(errSpy).toHaveBeenCalled();
      errSpy.mockRestore();
    });
  });

  //adicionales
});
