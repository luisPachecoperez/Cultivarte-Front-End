// ✅ src/tests/services/load-index-db.service.spec.ts (versión Jest)
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoadIndexDBService,
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

    pgDS = TestBed.inject(Parametros_generalesDataSource) as any;
    pdDS = TestBed.inject(Parametros_detalleDataSource) as any;
    personasDS = TestBed.inject(PersonasDataSource) as any;
    poblacionesDS = TestBed.inject(PoblacionesDataSource) as any;
    sedesDS = TestBed.inject(SedesDataSource) as any;
    personasSedesDS = TestBed.inject(Personas_sedesDataSource) as any;
    personasProgramasDS = TestBed.inject(Personas_programasDataSource) as any;
    personasGrupoInteresDS = TestBed.inject(Personas_grupo_interesDataSource) as any;
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
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    gql.query.mockReturnValue(throwError(() => error));
    service.ping().subscribe((res) => {
      expect(res).toContain('Server Error');
      done();
    });
  });

  // --- loadParametrosGenerales ---
  it('✅ loadParametrosGenerales carga datos', async () => {
    gql.query.mockReturnValue(of({ getParametrosGenerales: [createParametrosGenerales()] }));
    await service.loadParametrosGenerales();
    expect(pgDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadParametrosDetalle ---
  it('✅ loadParametrosDetalle carga datos', async () => {
    gql.query.mockReturnValue(of({ getParametrosDetalle: [createParametrosDetalle()] }));
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
        getPersonas: call === 1 ? Array(2500).fill(createPersona()) : [createPersona({ id_persona: '2' })],
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
    gql.query.mockReturnValue(of({ getPersonaProgramas: [createPersonasPrograma()] }));
    await service.loadPersonaProgramas();
    expect(personasProgramasDS.deleteFull).toHaveBeenCalled();
    expect(personasProgramasDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPersonasGrupoInteres ---
  it('✅ loadPersonasGrupoInteres carga con paginación', async () => {
    gql.query.mockReturnValue(of({ getPersonasGrupoInteres: [createPersonasGrupoInteres()] }));
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
          })
    );

    const spy = jest.spyOn(service, 'loadParametrosGenerales').mockResolvedValue(undefined);
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
});
