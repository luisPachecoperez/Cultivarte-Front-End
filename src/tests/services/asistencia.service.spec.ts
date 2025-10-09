import { TestBed } from '@angular/core/testing';
import { AsistenciaService } from '../../app/asistencia/asistencia-lista/services/asistencia.service';

import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { AsistenciasDataSource } from '../../app/indexdb/datasources/asistencias-datasource';
import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { LoadingService } from '../../app/shared/services/loading.service';
import { of } from 'rxjs';
import { PreAsistencia } from '../../app/asistencia/interfaces/pre-asistencia.interface';
import { AsistenciaPayLoad} from '../../app/asistencia/interfaces/asistencia-payload.interface';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';

// 🧩 Mock services
class LoadIndexDBServiceMock {
  ping = jasmine.createSpy('ping');
}
class ActividadesDataSourceMock {
  getPreAsistencia = jasmine.createSpy('getPreAsistencia');
}
class AsistenciasDataSourceMock {
  create = jasmine.createSpy('create');
}
class SesionesDataSourceMock {
  getById = jasmine.createSpy('getById');
  update = jasmine.createSpy('update');
}
class GraphQLServiceMock {
  query = jasmine.createSpy('query');
  mutation = jasmine.createSpy('mutation');
}
class LoadingServiceMock {
  show = jasmine.createSpy('show');
  hide = jasmine.createSpy('hide');
}

describe('🧠 AsistenciaService', () => {
  let service: AsistenciaService;
  let loadIndexDBService: LoadIndexDBServiceMock;
  let graphQLService: GraphQLServiceMock;
  let actividadesDS: ActividadesDataSourceMock;
  let asistenciasDS: AsistenciasDataSourceMock;
  let sesionesDS: SesionesDataSourceMock;
  let loadingService: LoadingServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AsistenciaService,
        { provide: LoadIndexDBService, useClass: LoadIndexDBServiceMock },
        { provide: ActividadesDataSource, useClass: ActividadesDataSourceMock },
        { provide: AsistenciasDataSource, useClass: AsistenciasDataSourceMock },
        { provide: SesionesDataSource, useClass: SesionesDataSourceMock },
        { provide: GraphQLService, useClass: GraphQLServiceMock },
        { provide: LoadingService, useClass: LoadingServiceMock },
      ],
    });

    service = TestBed.inject(AsistenciaService);
    loadIndexDBService = TestBed.inject(LoadIndexDBService) as unknown as LoadIndexDBServiceMock;
    graphQLService = TestBed.inject(GraphQLService) as unknown as GraphQLServiceMock;
    actividadesDS = TestBed.inject(ActividadesDataSource) as unknown as ActividadesDataSourceMock;
    asistenciasDS = TestBed.inject(AsistenciasDataSource) as unknown as AsistenciasDataSourceMock;
    sesionesDS = TestBed.inject(SesionesDataSource) as unknown as SesionesDataSourceMock;
    loadingService = TestBed.inject(LoadingService) as unknown as LoadingServiceMock;
  });

  // 🔹 obtenerDetalleAsistencia
  it('🔍 debe obtener detalle de asistencia desde backend cuando ping = pong', async () => {
    const mockPre: PreAsistencia = {
      id_sesion: 'S1',
      id_sede: 'X',
      numero_asistentes: 5,
      foto: '',
      descripcion: '',
      imagen: '',
      sedes: [],
      beneficiarios: [],
      asistentes_sesiones: [],
    };

    loadIndexDBService.ping.and.returnValue(of('pong'));
    graphQLService.query.and.returnValue(of({ getPreAsistencia: mockPre }));

    const result = await service.obtenerDetalleAsistencia('S1');

    expect(graphQLService.query).toHaveBeenCalled();
    expect(loadingService.show).toHaveBeenCalled();
    expect(loadingService.hide).toHaveBeenCalled();
    expect(result.id_sesion).toBe('S1');
  });

  it('📴 debe obtener detalle de asistencia desde IndexedDB cuando no hay conexión', async () => {
    const mockOffline = { id_sesion: 'OFF1' };
    loadIndexDBService.ping.and.returnValue(of('offline'));
    actividadesDS.getPreAsistencia.and.returnValue(Promise.resolve(mockOffline));

    const result = await service.obtenerDetalleAsistencia('OFF1');
    expect(actividadesDS.getPreAsistencia).toHaveBeenCalledWith('OFF1');
    expect(loadingService.hide).toHaveBeenCalled();
    expect(result.id_sesion).toBe('OFF1');
  });

  // 🔹 guardarAsistencia
  it('💾 debe guardar asistencias online (ping = pong)', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
    } as any;

    loadIndexDBService.ping.and.returnValue(of('pong'));
    graphQLService.mutation.and.returnValue(
      of({ updateAsistencias: { exitoso: 'S', mensaje: 'OK' } }),
    );

    const result = await service.guardarAsistencia(input);
    expect(graphQLService.mutation).toHaveBeenCalled();
    expect(asistenciasDS.create).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
  });

  it('📴 debe guardar asistencias offline (ping != pong)', async () => {
    const input: AsistenciaPayLoad = {
      nuevos: [{ id_persona: 'P1', id_sesion: 'S1', id_asistencia: 'A1' }],
    } as any;

    loadIndexDBService.ping.and.returnValue(of('offline'));

    const result = await service.guardarAsistencia(input);
    expect(asistenciasDS.create).toHaveBeenCalled();
    expect(result.mensaje).toContain('offline');
  });

  // 🔹 guardarAsistenciaFotografica
  it('📸 debe actualizar asistencia fotográfica online', async () => {
    const input: Sesiones = {
      id_sesion: 'S1',
      id_actividad: 'A1',
      imagen: 'img.png',
      descripcion: 'desc',
      nro_asistentes: 5,
    } as any;

    loadIndexDBService.ping.and.returnValue(of('pong'));
    graphQLService.mutation.and.returnValue(of({ updateAsistencias: { exitoso: 'S', mensaje: 'OK' } }));
    sesionesDS.getById.and.returnValue(Promise.resolve({ id_sesion: 'S1' }));
    sesionesDS.update.and.returnValue(Promise.resolve());

    const result = await service.guardarAsistenciaFotografica(input);
    expect(graphQLService.mutation).toHaveBeenCalled();
    expect(sesionesDS.update).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
  });

  it('🧩 debe guardar asistencia fotográfica offline', async () => {
    const input: Sesiones = {
      id_sesion: 'S2',
      id_actividad: 'A2',
      imagen: 'img.png',
      descripcion: 'offline desc',
      nro_asistentes: 3,
    } as any;

    loadIndexDBService.ping.and.returnValue(of('offline'));
    sesionesDS.getById.and.returnValue(Promise.resolve({ id_sesion: 'S2' }));
    sesionesDS.update.and.returnValue(Promise.resolve());

    const result = await service.guardarAsistenciaFotografica(input);
    expect(sesionesDS.update).toHaveBeenCalled();
    expect(result.mensaje).toContain('offline');
  });
});
