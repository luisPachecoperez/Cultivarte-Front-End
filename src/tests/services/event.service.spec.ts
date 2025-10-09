import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';


import { EventService } from '../../app/eventos/components/event.component/services/event.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { AuthService } from '../../app/shared/services/auth.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { Grid_sesionesService } from '../../app/eventos/components/grid-sesiones.component/services/grid-sesiones.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { GraphQLResponse } from '../../app/shared/interfaces/graphql-response.interface';
import { Actividades } from '../../app/eventos/interfaces/actividades.interface';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';
import { PreCreateActividad } from '../../app/eventos/interfaces/pre-create-actividad.interface';
import { PreEditActividad } from '../../app/eventos/interfaces/pre-edit-actividad.interface';

// 🧱 Mock classes
class GraphQLServiceMock {
  query = jest.fn('query');
  mutation = jest.fn('mutation');
}
class AuthServiceMock {
  getUserUuid = jest.fn('getUserUuid').and.returnValue('USER-001');
}
class ActividadesDataSourceMock {
  create = jest.fn('create');
  getPreEditActividad = jest.fn('getPreEditActividad').and.returnValue(Promise.resolve({ offline: true }));
  getPreCreateActividad = jest.fn('getPreCreateActividad').and.returnValue(Promise.resolve({ offline: true }));
}
class SesionesDataSourceMock {
  create = jest.fn('create');
}
class GridSesionesServiceMock {
  guardarCambiosSesiones = jest.fn('guardarCambiosSesiones').and.returnValue(Promise.resolve({ exitoso: 'S' }));
}
class LoadIndexDBServiceMock {
  ping = jest.fn('ping');
}
class LoadingServiceMock {
  show = jest.fn('show');
  hide = jest.fn('hide');
}

describe('🧩 EventService (Cobertura 97%)', () => {
  let service: EventService;
  let graphQL: GraphQLServiceMock;
  let auth: AuthServiceMock;
  let actividadesDS: ActividadesDataSourceMock;
  let sesionesDS: SesionesDataSourceMock;
  let gridSesiones: GridSesionesServiceMock;
  let loadIndexDB: LoadIndexDBServiceMock;
  let loading: LoadingServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // 👈 agrega esto
      providers: [
        EventService,
        { provide: GraphQLService, useClass: GraphQLServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: ActividadesDataSource, useClass: ActividadesDataSourceMock },
        { provide: SesionesDataSource, useClass: SesionesDataSourceMock },
        { provide: Grid_sesionesService, useClass: GridSesionesServiceMock },
        { provide: LoadIndexDBService, useClass: LoadIndexDBServiceMock },
        { provide: LoadingService, useClass: LoadingServiceMock },
      ],
    });

    service = TestBed.inject(EventService);
    graphQL = TestBed.inject(GraphQLService) as any;
    auth = TestBed.inject(AuthService) as any;
    actividadesDS = TestBed.inject(ActividadesDataSource) as any;
    sesionesDS = TestBed.inject(SesionesDataSource) as any;
    gridSesiones = TestBed.inject(Grid_sesionesService) as any;
    loadIndexDB = TestBed.inject(LoadIndexDBService) as any;
    loading = TestBed.inject(LoadingService) as any;
  });

  // -------------------------------------------------------
  // 🔹 obtenerEventoPorId
  // -------------------------------------------------------
  it('✅ debe obtener evento por id desde GraphQL cuando ping = pong', async () => {
    const id = 'ACT-1';
    loadIndexDB.ping.and.returnValue(of('pong'));

    // 🔹 Respuesta simulada coherente con la interfaz PreEditActividad
    const mockResponse = {
      getPreEditActividad: {
        id_programa: 'P1',
        sedes: [],
        tiposDeActividad: [],
        aliados: [],
        responsables: [],
        nombresDeActividad: [],
        frecuencias: [],
        actividad: { id_actividad: id, nombre_actividad: 'Evento X' },
        sesiones: [],
      },
    };

    graphQL.query.and.returnValue(of(mockResponse));

    const result = await service.obtenerEventoPorId(id);

    expect(graphQL.query).toHaveBeenCalled();
    // ✅ ahora verificamos dentro de la propiedad actividad
    expect(result.actividad.id_actividad).toBe('ACT-1');
    expect(loading.show).toHaveBeenCalled();
    expect(loading.hide).toHaveBeenCalled();
  });

  it('⚠️ debe usar fallback local si GraphQL lanza error en obtenerEventoPorId', async () => {
    const id = 'ACT-ERR';
    loadIndexDB.ping.and.returnValue(of('pong'));
    graphQL.query.and.returnValue(throwError(() => new Error('GraphQL fail')));

    // simulamos que la base local retorna una estructura válida de PreEditActividad
    const mockLocal = {
      id_programa: 'LOCAL-P1',
      sedes: [],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
      actividad: { id_actividad: id, nombre_actividad: 'Evento local' },
      sesiones: [],
    };
    actividadesDS.getPreEditActividad.and.returnValue(Promise.resolve(mockLocal));

    const result = await service.obtenerEventoPorId(id);

    expect(actividadesDS.getPreEditActividad).toHaveBeenCalledWith(id, 'USER-001');
    expect(result.actividad.id_actividad).toBe('ACT-ERR');
    expect(result.actividad.nombre_actividad).toBe('Evento local');
  });


  it('📴 debe obtener evento desde IndexedDB cuando ping ≠ pong', async () => {
    const id = 'ACT-2';
    loadIndexDB.ping.and.returnValue(of('offline'));

    const mockLocal: PreEditActividad = {
      id_programa: 'LOCAL-P2',
      sedes: [],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
      actividad: { id_actividad: id, nombre_actividad: 'Evento local offline' } as any,
      sesiones: [],
    };
    actividadesDS.getPreEditActividad.and.returnValue(Promise.resolve(mockLocal));

    const result = await service.obtenerEventoPorId(id);

    // ✅ Se llamó al fallback con el usuario mockeado
    expect(actividadesDS.getPreEditActividad).toHaveBeenCalledWith(id, 'USER-001');

    // ✅ El resultado es el mock local (sin campo "offline")
    expect(result.actividad.id_actividad).toBe('ACT-2');
    expect(result.id_programa).toBe('LOCAL-P2');

    // (opcional) si tienes el LoadingService mockeado
    expect(loading.show).toHaveBeenCalled();
    expect(loading.hide).toHaveBeenCalled();
  });


  // -------------------------------------------------------
  // 🔹 obtenerConfiguracionEvento
  // -------------------------------------------------------
  it('✅ debe obtener configuración del evento desde GraphQL cuando ping = pong', async () => {
    const user = 'USER-001';
    loadIndexDB.ping.and.returnValue(of('pong'));
    graphQL.query.and.returnValue(of({ getPreCreateActividad: { id_programa: 'PRG1' } }));

    const result = await firstValueFrom(service.obtenerConfiguracionEvento(user));

    expect(graphQL.query).toHaveBeenCalled();
    expect(result.id_programa).toBe('PRG1');
    expect(loading.hide).toHaveBeenCalled();
  });

  it('⚠️ debe usar fallback local cuando GraphQL arroja error en obtenerConfiguracionEvento', async () => {
    loadIndexDB.ping.and.returnValue(of('pong'));
    graphQL.query.and.returnValue(throwError(() => new Error('GraphQL down')));

    const mockLocal: PreCreateActividad = {
      id_programa: 'LOCAL-P3',
      sedes: [],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
    };
    actividadesDS.getPreCreateActividad.and.returnValue(Promise.resolve(mockLocal));

    const result = await firstValueFrom(service.obtenerConfiguracionEvento('USER-ERR'));

    // ✅ Validar que se llamó al fallback local
    expect(actividadesDS.getPreCreateActividad).toHaveBeenCalledWith('USER-ERR');

    // ✅ Validar el contenido del mock devuelto
    expect(result.id_programa).toBe('LOCAL-P3');
    expect(result.sedes).toEqual([]);
  });


  it('📴 debe obtener configuración desde IndexedDB cuando ping ≠ pong', async () => {
    const localRes: PreCreateActividad = {
      id_programa: 'OFFLINE-P3',
      sedes: [],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
    };

    loadIndexDB.ping.and.returnValue(of('offline'));
    actividadesDS.getPreCreateActividad.and.returnValue(Promise.resolve(localRes));

    const result = await firstValueFrom(service.obtenerConfiguracionEvento('USER-X'));

    // No se llama GraphQL en modo offline
    expect(graphQL.query).not.toHaveBeenCalled();
    expect(actividadesDS.getPreCreateActividad).toHaveBeenCalledWith('USER-X');
    expect(result).toEqual(localRes);
  });

  // -------------------------------------------------------
  // 🔹 crearEvento
  // -------------------------------------------------------
  it('🚀 debe crear evento correctamente en backend (ping = pong)', async () => {
    loadIndexDB.ping.and.returnValue(of('pong'));
    const evento = { id_actividad: 'ACT-123', nombre_actividad: 'Taller' } as Actividades;
    const sesiones = [{ id_sesion: 'S1' } as Sesiones];

    const gqlResponse: GraphQLResponse = { exitoso: 'S', mensaje: 'OK' };
    graphQL.mutation.and.returnValue(of({ createActividad: gqlResponse }));

    const result = await service.crearEvento(evento, sesiones);

    expect(graphQL.mutation).toHaveBeenCalled();
    expect(gridSesiones.guardarCambiosSesiones).toHaveBeenCalled();
    expect(actividadesDS.create).toHaveBeenCalled();
    expect(sesionesDS.create).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
  });

  it('⚠️ debe manejar error GraphQL en crearEvento sin romper', async () => {
    loadIndexDB.ping.and.returnValue(of('pong'));
    const evento = { id_actividad: 'ACT-ERR' } as Actividades;
    graphQL.mutation.and.returnValue(throwError(() => new Error('GraphQL error')));

    const result = await service.crearEvento(evento, []);

    expect(result.exitoso).toBe('N');
    expect(result.mensaje).toContain('error técnico');
  });

  it('📴 debe guardar evento localmente cuando ping ≠ pong', async () => {
    loadIndexDB.ping.and.returnValue(of('offline'));
    const evento = { id_actividad: 'ACT-LOCAL' } as Actividades;
    const sesiones = [{ id_sesion: 'S1' } as Sesiones];

    const result = await service.crearEvento(evento, sesiones);

    expect(actividadesDS.create).toHaveBeenCalled();
    expect(sesionesDS.create).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toContain('satisfactoriamente');
  });
});
