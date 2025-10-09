// src/tests/services/load-index-db.service.spec.ts
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
  query = jasmine.createSpy('query');
}

class MockDatabaseService {}

// DataSource mocks
class MockParametrosGeneralesDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
}
class MockParametrosDetalleDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
}
class MockPersonasDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
  deleteFull = jasmine.createSpy('deleteFull').and.returnValue(Promise.resolve());
}
class MockPoblacionesDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
}
class MockSedesDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
}
class MockPersonasSedesDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
  deleteFull = jasmine.createSpy('deleteFull').and.returnValue(Promise.resolve());
}
class MockPersonasProgramasDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
  deleteFull = jasmine.createSpy('deleteFull').and.returnValue(Promise.resolve());
}
class MockPersonasGrupoInteresDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
  deleteFull = jasmine.createSpy('deleteFull').and.returnValue(Promise.resolve());
}
class MockActividadesDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
  deleteFull = jasmine.createSpy('deleteFull').and.returnValue(Promise.resolve());
}
class MockAsistenciasDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
  deleteFull = jasmine.createSpy('deleteFull').and.returnValue(Promise.resolve());
}
class MockSesionesDS {
  bulkAdd = jasmine.createSpy('bulkAdd').and.returnValue(Promise.resolve());
  deleteFull = jasmine.createSpy('deleteFull').and.returnValue(Promise.resolve());
}

// === Helpers para crear objetos completos ===
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
  valores: '', // ❌ No puede ser null si la interfaz espera string
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
  id_padre: '', // ❌ No puede ser null si la interfaz espera string
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
  // Campos faltantes (ajusta según tu interfaz real)
  id_regional_davivienda: '',
  id_regional_seguros_bolivar: '',
  id_tipo_inmueble: '',
  id_espacio: '',
  direccion: '',
  telefono: '',
  correo: '',
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
  razon_social: '',
  email: 'a@b.com',
  // Campos faltantes (ajusta según tu interfaz real)
  id_colegio: '',
  id_sexo: '',
  id_ubicacion: '',
  fecha_nacimiento: '',
  celular: '',
  telefono_fijo: '',
  estado_civil: '',
  nivel_educativo: '',
  ocupacion: '',
  eps: '',
  regimen_salud: '',
  discapacidad: '',
  etnia: '',
  condicion_vulnerabilidad: '',
  id_poblacion: '',
  id_municipio_residencia: '',
  barrio: '',
  direccion_residencia: '',
  estrato: '',
  cabeza_hogar: '',
  personas_a_cargo: '',
  ingresos_mensuales: '',
  id_sede_registro: '',
  id_usuario_registro: '',
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
  id_tipo_actividad: 'T1',
  id_responsable: 'R1',
  id_aliado: 'AL1',
  id_sede: 'S1',
  id_frecuencia: 'F1',
  institucional: 'S', // ❌ Debe ser string, no boolean
  nombre_actividad: 'Act1',
  descripcion: 'Desc',
  fecha_actividad: '2025-01-01',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  plazo_asistencia: '30', // ❌ Debe ser string
  estado: 'A',
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  deleted: false,
  ...override,
});

const createSesion = (override: Partial<any> = {}) => ({
  id_sesion: 'S1',
  id_actividad: 'A1',
  fecha_actividad: '2025-01-01',
  hora_inicio: '08:00',
  hora_fin: '10:00',
  imagen: null,
  nro_asistentes: 10,
  id_creado_por: 'admin',
  fecha_creacion: '2025-01-01T00:00:00Z',
  id_modificado_por: 'admin',
  fecha_modificacion: '2025-01-01T00:00:00Z',
  syncStatus: 'synced',
  deleted: false,
  ...override,
});

const createAsistencia = (override: Partial<any> = {}) => ({
  id_asistencia: 'AS1',
  id_sesion: 'S1',
  id_persona: 'P1',
  id_creado_por: 'admin',
  fecha_creacion: new Date('2025-01-01T00:00:00Z'), // ❌ Debe ser Date, no string
  id_modificado_por: 'admin',
  fecha_modificacion: new Date('2025-01-01T00:00:00Z'),
  syncStatus: 'synced',
  deleted: false,
  ...override,
});

describe('🧩 LoadIndexDBService', () => {
  let service: LoadIndexDBService;
  let gql: MockGraphQL;

  // DataSources
  let pgDS: MockParametrosGeneralesDS;
  let pdDS: MockParametrosDetalleDS;
  let personasDS: MockPersonasDS;
  let poblacionesDS: MockPoblacionesDS;
  let sedesDS: MockSedesDS;
  let personasSedesDS: MockPersonasSedesDS;
  let personasProgramasDS: MockPersonasProgramasDS;
  let personasGrupoInteresDS: MockPersonasGrupoInteresDS;
  let actividadesDS: MockActividadesDS;
  let asistenciasDS: MockAsistenciasDS;
  let sesionesDS: MockSesionesDS;

  const userId = 'user123';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoadIndexDBService,
        { provide: GraphQLService, useClass: MockGraphQL },
        { provide: DatabaseService, useClass: MockDatabaseService },
        { provide: Parametros_generalesDataSource, useClass: MockParametrosGeneralesDS },
        { provide: Parametros_detalleDataSource, useClass: MockParametrosDetalleDS },
        { provide: PersonasDataSource, useClass: MockPersonasDS },
        { provide: PoblacionesDataSource, useClass: MockPoblacionesDS },
        { provide: SedesDataSource, useClass: MockSedesDS },
        { provide: Personas_sedesDataSource, useClass: MockPersonasSedesDS },
        { provide: Personas_programasDataSource, useClass: MockPersonasProgramasDS },
        { provide: Personas_grupo_interesDataSource, useClass: MockPersonasGrupoInteresDS },
        { provide: ActividadesDataSource, useClass: MockActividadesDS },
        { provide: AsistenciasDataSource, useClass: MockAsistenciasDS },
        { provide: SesionesDataSource, useClass: MockSesionesDS },
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
  it('ping devuelve "pong" en éxito', (done) => {
    gql.query.and.returnValue(of({ ping: { ping: 'pong' } }));
    service.ping().subscribe((res) => {
      expect(res).toBe('pong');
      done();
    });
  });

  it('ping maneja error HTTP', (done) => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    gql.query.and.returnValue(throwError(() => error));
    service.ping().subscribe((res) => {
      expect(res).toContain('Server Error');
      done();
    });
  });

  // --- loadParametrosGenerales ---
  it('loadParametrosGenerales carga datos', async () => {
    const mockData = [createParametrosGenerales()];
    gql.query.and.returnValue(of({ getParametrosGenerales: mockData }));
    await service.loadParametrosGenerales();
    expect(pgDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadParametrosDetalle ---
  it('loadParametrosDetalle carga datos', async () => {
    const mockData = [createParametrosDetalle()];
    gql.query.and.returnValue(of({ getParametrosDetalle: mockData }));
    await service.loadParametrosDetalle();
    expect(pdDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPoblaciones ---
  it('loadPoblaciones carga datos', async () => {
    const mockData = [createPoblacion()];
    gql.query.and.returnValue(of({ getPoblaciones: mockData }));
    await service.loadPoblaciones();
    expect(poblacionesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadSedes ---
  it('loadSedes carga datos', async () => {
    const mockData = [createSede()];
    gql.query.and.returnValue(of({ getSedes: mockData }));
    await service.loadSedes();
    expect(sedesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPersonas ---
  it('loadPersonas carga con paginación', async () => {
    let call = 0;
    gql.query.and.callFake(() => {
      call++;
      const data = call === 1
        ? Array(2500).fill(createPersona()) // primera página llena
        : [createPersona({ id_persona: '2' })]; // segunda página corta
      return of({ getPersonas: data });
    });

    await service.loadPersonas();

    expect(personasDS.deleteFull).toHaveBeenCalled();
    expect(personasDS.bulkAdd).toHaveBeenCalledTimes(2); // 2 páginas procesadas
    expect(gql.query).toHaveBeenCalledTimes(2);
  });



  // --- loadPersonasSedes ---
  it('loadPersonasSedes carga con paginación', async () => {
    const data = [createPersonasSede()];
    gql.query.and.returnValue(of({ getPersonasSedes: data }));
    await service.loadPersonasSedes();
    expect(personasSedesDS.deleteFull).toHaveBeenCalled();
    expect(personasSedesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPersonaProgramas ---
  it('loadPersonaProgramas carga con paginación', async () => {
    const data = [createPersonasPrograma()];
    gql.query.and.returnValue(of({ getPersonaProgramas: data }));
    await service.loadPersonaProgramas();
    expect(personasProgramasDS.deleteFull).toHaveBeenCalled();
    expect(personasProgramasDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadPersonasGrupoInteres ---
  it('loadPersonasGrupoInteres carga con paginación', async () => {
    const data = [createPersonasGrupoInteres()];
    gql.query.and.returnValue(of({ getPersonasGrupoInteres: data }));
    await service.loadPersonasGrupoInteres();
    expect(personasGrupoInteresDS.deleteFull).toHaveBeenCalled();
    expect(personasGrupoInteresDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadActividadesSede ---
  it('loadActividadesSede carga actividades por usuario', async () => {
    const data = [createActividad()];
    gql.query.and.returnValue(of({ getActividadSedes: data }));
    await service.loadActividadesSede(userId);
    expect(actividadesDS.deleteFull).toHaveBeenCalled();
    expect(actividadesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadSesionesSede ---
  it('loadSesionesSede carga sesiones por usuario', async () => {
    const data = [createSesion()];
    gql.query.and.returnValue(of({ getSesionesSedes: data }));
    await service.loadSesionesSede(userId);
    expect(sesionesDS.deleteFull).toHaveBeenCalled();
    expect(sesionesDS.bulkAdd).toHaveBeenCalled();
  });

  // --- loadAsistenciasSede ---
  it('loadAsistenciasSede carga asistencias por usuario', async () => {
    const data = [createAsistencia()];
    gql.query.and.returnValue(of({ getAsistenciasSede: data }));
    await service.loadAsistenciasSede(userId);
    expect(asistenciasDS.deleteFull).toHaveBeenCalled();
    expect(asistenciasDS.bulkAdd).toHaveBeenCalled();
  });

  // --- cargarDatosIniciales ---
  it('cargarDatosIniciales ejecuta todo si ping = "pong"', async () => {
    gql.query.and.callFake((query: string) => {
      if (query.includes('Ping')) {
        return of({ ping: { ping: 'pong' } });
      }
      return of({
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
      });
    });

    const spy = spyOn(service, 'loadParametrosGenerales').and.callThrough();
    service.cargarDatosIniciales(userId);
    await new Promise((r) => setTimeout(r, 50));
    expect(spy).toHaveBeenCalled();
  });

  it('cargarDatosIniciales no carga si ping falla', async () => {
    gql.query.and.returnValue(of({ ping: { ping: 'fail' } }));
    const spy = spyOn(service, 'loadParametrosGenerales');
    service.cargarDatosIniciales(userId);
    await new Promise((r) => setTimeout(r, 50));
    expect(spy).not.toHaveBeenCalled();
  });
});
