import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
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

// 🧱 Mock classes (versión Jest)
class GraphQLServiceMock {
  query = jest.fn();
  mutation = jest.fn();
}
class AuthServiceMock {
  getUserUuid = jest.fn().mockReturnValue('USER-001');
}
class ActividadesDataSourceMock {
  create = jest.fn();
  getPreEditActividad = jest.fn().mockResolvedValue({ offline: true });
  getPreCreateActividad = jest.fn().mockResolvedValue({ offline: true });
}
class SesionesDataSourceMock {
  create = jest.fn();
}
class GridSesionesServiceMock {
  guardarCambiosSesiones = jest.fn().mockResolvedValue({ exitoso: 'S' });
}
class LoadIndexDBServiceMock {
  ping = jest.fn();
}
class LoadingServiceMock {
  show = jest.fn();
  hide = jest.fn();
}

describe('🧩 EventService (Jest, Cobertura 97%)', () => {
  let service: EventService;
  let graphQL: jest.Mocked<GraphQLServiceMock>;
  let auth: jest.Mocked<AuthServiceMock>;
  let actividadesDS: jest.Mocked<ActividadesDataSourceMock>;
  let sesionesDS: jest.Mocked<SesionesDataSourceMock>;
  let gridSesiones: jest.Mocked<GridSesionesServiceMock>;
  let loadIndexDB: jest.Mocked<LoadIndexDBServiceMock>;
  let loading: jest.Mocked<LoadingServiceMock>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
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
    loadIndexDB.ping.mockReturnValue(of('pong'));

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

    graphQL.query.mockReturnValue(of(mockResponse));

    const result = await service.obtenerEventoPorId(id);

    expect(graphQL.query).toHaveBeenCalled();
    expect(result.actividad.id_actividad).toBe('ACT-1');
    expect(loading.show).toHaveBeenCalled();
    expect(loading.hide).toHaveBeenCalled();
  });

  it('⚠️ debe usar fallback local si GraphQL lanza error en obtenerEventoPorId', async () => {
    const id = 'ACT-ERR';
    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.query.mockReturnValue(throwError(() => new Error('GraphQL fail')));

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
    actividadesDS.getPreEditActividad.mockResolvedValue(mockLocal);

    const result = await service.obtenerEventoPorId(id);

    expect(actividadesDS.getPreEditActividad).toHaveBeenCalledWith(
      id,
      'USER-001',
    );
    expect(result.actividad.id_actividad).toBe('ACT-ERR');
    expect(result.actividad.nombre_actividad).toBe('Evento local');
  });

  it('📴 debe obtener evento desde IndexedDB cuando ping ≠ pong', async () => {
    const id = 'ACT-2';
    loadIndexDB.ping.mockReturnValue(of('offline'));

    const mockLocal: PreEditActividad = {
      id_programa: 'LOCAL-P2',
      sedes: [],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
      actividad: {
        id_actividad: id,
        nombre_actividad: 'Evento local offline',
      } as any,
      sesiones: [],
    };
    actividadesDS.getPreEditActividad.mockResolvedValue(mockLocal);

    const result = await service.obtenerEventoPorId(id);

    expect(actividadesDS.getPreEditActividad).toHaveBeenCalledWith(
      id,
      'USER-001',
    );
    expect(result.actividad.id_actividad).toBe('ACT-2');
    expect(result.id_programa).toBe('LOCAL-P2');
    expect(loading.show).toHaveBeenCalled();
    expect(loading.hide).toHaveBeenCalled();
  });

  // -------------------------------------------------------
  // 🔹 obtenerConfiguracionEvento
  // -------------------------------------------------------
  it('✅ debe obtener configuración del evento desde GraphQL cuando ping = pong', async () => {
    const user = 'USER-001';
    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.query.mockReturnValue(
      of({ getPreCreateActividad: { id_programa: 'PRG1' } }),
    );

    const result = await firstValueFrom(
      service.obtenerConfiguracionEvento(user),
    );

    expect(graphQL.query).toHaveBeenCalled();
    expect(result.id_programa).toBe('PRG1');
    expect(loading.hide).toHaveBeenCalled();
  });

  it('⚠️ debe usar fallback local cuando GraphQL arroja error en obtenerConfiguracionEvento', async () => {
    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.query.mockReturnValue(throwError(() => new Error('GraphQL down')));

    const mockLocal: PreCreateActividad = {
      id_programa: 'LOCAL-P3',
      sedes: [],
      tiposDeActividad: [],
      aliados: [],
      responsables: [],
      nombresDeActividad: [],
      frecuencias: [],
    };
    actividadesDS.getPreCreateActividad.mockResolvedValue(mockLocal);

    const result = await firstValueFrom(
      service.obtenerConfiguracionEvento('USER-ERR'),
    );

    expect(actividadesDS.getPreCreateActividad).toHaveBeenCalledWith(
      'USER-ERR',
    );
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

    loadIndexDB.ping.mockReturnValue(of('offline'));
    actividadesDS.getPreCreateActividad.mockResolvedValue(localRes);

    const result = await firstValueFrom(
      service.obtenerConfiguracionEvento('USER-X'),
    );

    expect(graphQL.query).not.toHaveBeenCalled();
    expect(actividadesDS.getPreCreateActividad).toHaveBeenCalledWith('USER-X');
    expect(result).toEqual(localRes);
  });

  // -------------------------------------------------------
  // 🔹 crearEvento
  // -------------------------------------------------------
  it('🚀 debe crear evento correctamente en backend (ping = pong)', async () => {
    loadIndexDB.ping.mockReturnValue(of('pong'));
    const evento = {
      id_actividad: 'ACT-123',
      nombre_actividad: 'Taller',
    } as Actividades;
    const sesiones = [{ id_sesion: 'S1' } as Sesiones];

    const gqlResponse: GraphQLResponse = { exitoso: 'S', mensaje: 'OK' };
    graphQL.mutation.mockReturnValue(of({ createActividad: gqlResponse }));

    const result = await service.crearEvento(evento, sesiones);

    expect(graphQL.mutation).toHaveBeenCalled();
    expect(gridSesiones.guardarCambiosSesiones).toHaveBeenCalled();
    expect(actividadesDS.create).toHaveBeenCalled();
    expect(sesionesDS.create).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
  });

  it('⚠️ debe manejar error GraphQL en crearEvento sin romper', async () => {
    loadIndexDB.ping.mockReturnValue(of('pong'));
    const evento = { id_actividad: 'ACT-ERR' } as Actividades;
    graphQL.mutation.mockReturnValue(
      throwError(() => new Error('GraphQL error')),
    );

    const result = await service.crearEvento(evento, []);

    expect(result.exitoso).toBe('N');
    expect(result.mensaje).toContain('error técnico');
  });

  it('📴 debe guardar evento localmente cuando ping ≠ pong', async () => {
    loadIndexDB.ping.mockReturnValue(of('offline'));
    const evento = { id_actividad: 'ACT-LOCAL' } as Actividades;
    const sesiones = [{ id_sesion: 'S1' } as Sesiones];

    const result = await service.crearEvento(evento, sesiones);

    expect(actividadesDS.create).toHaveBeenCalled();
    expect(sesionesDS.create).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toContain('satisfactoriamente');
  });
});
