import { TestBed } from '@angular/core/testing';
import { CalendarService } from '../../app/calendar/services/calendar.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { Sesiones } from '../../app/eventos/interfaces/sesiones.interface';
import { of, throwError } from 'rxjs';

// ✅ Clases mockeadas adaptadas a Jest
class GraphQLServiceMock {
  query = jest.fn();
}
class ActividadesDataSourceMock {
  consultarFechaCalendario = jest.fn();
}
class LoadIndexDBServiceMock {
  ping = jest.fn();
}

describe('🗓️ CalendarService (Jest)', () => {
  let service: CalendarService;
  let graphqlService: jest.Mocked<GraphQLServiceMock>;
  let actividadesDS: jest.Mocked<ActividadesDataSourceMock>;
  let loadIndexDBService: jest.Mocked<LoadIndexDBServiceMock>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CalendarService,
        { provide: GraphQLService, useClass: GraphQLServiceMock },
        { provide: ActividadesDataSource, useClass: ActividadesDataSourceMock },
        { provide: LoadIndexDBService, useClass: LoadIndexDBServiceMock },
      ],
    });

    service = TestBed.inject(CalendarService);
    graphqlService = TestBed.inject(GraphQLService) as any;
    actividadesDS = TestBed.inject(ActividadesDataSource) as any;
    loadIndexDBService = TestBed.inject(LoadIndexDBService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Caso 1: backend activo y GraphQL devuelve sesiones
  it('✅ debe obtener sesiones desde GraphQL cuando ping = pong', async () => {
    const fechaInicio = '2025-10-01';
    const fechaFin = '2025-10-05';
    const idUsuario = 'USER1';

    const mockSesiones: Sesiones[] = [
      {
        id_sesion: 'S1',
        nombre_actividad: 'Taller Angular',
        desde: '2025-10-02',
        hasta: '2025-10-02',
        asistentes_evento: 20,
      } as any,
    ];

    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphqlService.query.mockReturnValue(
      of({ consultarFechaCalendario: mockSesiones }) as any,
    );

    const result = await service.obtenerSesiones(
      fechaInicio,
      fechaFin,
      idUsuario,
    );

    expect(graphqlService.query).toHaveBeenCalled();
    expect(result.length).toBe(1);
    expect(result[0].title).toBe('Taller Angular');
    expect(result[0].extendedProps.id_sesion).toBe('S1');
  });

  // ⚙️ Caso 1b: backend activo pero sin resultados
  it('⚙️ debe devolver arreglo vacío si GraphQL responde vacío', async () => {
    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphqlService.query.mockReturnValue(
      of({ consultarFechaCalendario: [] }) as any,
    );

    const result = await service.obtenerSesiones(
      '2025-01-01',
      '2025-01-02',
      'USER2',
    );
    expect(result).toEqual([]);
  });

  // ⚙️ Caso 1c: GraphQL responde undefined (branch de seguridad)
  it('⚙️ debe manejar respuesta undefined de GraphQL sin romper', async () => {
    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphqlService.query.mockReturnValue(of(undefined as any));

    const result = await service.obtenerSesiones(
      '2025-02-01',
      '2025-02-02',
      'USER3',
    );
    expect(result).toEqual([]);
  });

  // ⚠️ Caso 2: GraphQL lanza error → fallback a IndexedDB
  it('⚠️ debe usar IndexedDB cuando GraphQL arroja error', async () => {
    const fallbackSesiones = [
      {
        id_sesion: 'F1',
        nombre_actividad: 'Evento Offline',
        desde: '2025-10-03',
        hasta: '2025-10-03',
      },
    ];

    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphqlService.query.mockReturnValue(
      throwError(() => new Error('GraphQL error')),
    );
    actividadesDS.consultarFechaCalendario.mockResolvedValue(fallbackSesiones);

    const result = await service.obtenerSesiones(
      '2025-10-01',
      '2025-10-05',
      'USER4',
    );

    expect(graphqlService.query).toHaveBeenCalled();
    expect(actividadesDS.consultarFechaCalendario).toHaveBeenCalled();
    expect(result[0].id_sesion).toBe('F1');
  });

  // 📴 Caso 3: backend inactivo → usa IndexedDB directamente
  it('📴 debe obtener sesiones desde IndexedDB cuando ping ≠ pong', async () => {
    const offlineSesiones = [
      {
        id: 'O1',
        title: 'Capacitación',
        start: '2025-10-11T08:00',
        end: '2025-10-11T10:00',
        extendedProps: {
          id_sesion: 'O1',
          id_actividad: 'A1',
          nombre_actividad: 'Capacitación',
          desde: '2025-10-11T08:00',
          hasta: '2025-10-11T10:00',
          asistentes_evento: 12,
        },
      },
    ];

    loadIndexDBService.ping.mockReturnValue(of('offline'));
    actividadesDS.consultarFechaCalendario.mockResolvedValue(offlineSesiones);

    const result = await service.obtenerSesiones(
      '2025-10-10',
      '2025-10-12',
      'USER5',
    );

    expect(actividadesDS.consultarFechaCalendario).toHaveBeenCalled();
    expect(result[0].extendedProps.id_sesion).toBe('O1');
    expect(result[0].extendedProps.nombre_actividad).toBe('Capacitación');
  });

  // ⚠️ Caso 4: Fallback offline con error inesperado
  it('🚨 debe lanzar error si el fallback IndexedDB también falla', async () => {
    loadIndexDBService.ping.mockReturnValue(of('pong'));
    graphqlService.query.mockReturnValue(
      throwError(() => new Error('Network fail')),
    );
    actividadesDS.consultarFechaCalendario.mockRejectedValue('IndexedDB error');

    await expect(
      service.obtenerSesiones('2025-10-10', '2025-10-11', 'USER6'),
    ).rejects.toBe('IndexedDB error');
  });
});
