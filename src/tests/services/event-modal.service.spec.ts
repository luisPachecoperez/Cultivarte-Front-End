// ✅ src/tests/services/event-modal.service.spec.ts (versión Jest)
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { EventModalService } from '../../app/eventos/components/event-modal.component/services/event-modal.service';
import { ActividadesDataSource } from '../../app/indexdb/datasources/actividades-datasource';
import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { GraphQLResponse } from '../../app/shared/interfaces/graphql-response.interface';

// 🧱 Mocks Jest
class ActividadesDataSourceMock {
  delete = jest.fn().mockResolvedValue(true);
}
class LoadIndexDBServiceMock {
  ping = jest.fn();
}
class GraphQLServiceMock {
  mutation = jest.fn();
}

describe('🧩 EventModalService (Jest)', () => {
  let service: EventModalService;
  let actividadesDS: ActividadesDataSourceMock;
  let loadIndexDB: LoadIndexDBServiceMock;
  let graphQL: GraphQLServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventModalService,
        { provide: ActividadesDataSource, useClass: ActividadesDataSourceMock },
        { provide: LoadIndexDBService, useClass: LoadIndexDBServiceMock },
        { provide: GraphQLService, useClass: GraphQLServiceMock },
      ],
    });

    service = TestBed.inject(EventModalService);
    actividadesDS = TestBed.inject(ActividadesDataSource) as any;
    loadIndexDB = TestBed.inject(LoadIndexDBService) as any;
    graphQL = TestBed.inject(GraphQLService) as any;
  });

  // ✅ Caso 1: backend activo → elimina en GraphQL y local
  it('✅ debe eliminar evento en backend e IndexedDB cuando ping = pong y exitoso = S', async () => {
    const id = 'EVT-123';
    loadIndexDB.ping.mockReturnValue(of('pong'));
    const mockResponse: GraphQLResponse = { exitoso: 'S', mensaje: 'Eliminado' };
    graphQL.mutation.mockReturnValue(of({ deleteActividad: mockResponse }));

    const result = await service.eliminarEvento(id);

    expect(loadIndexDB.ping).toHaveBeenCalled();
    expect(graphQL.mutation).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id_actividad: id })
    );
    expect(actividadesDS.delete).toHaveBeenCalledWith(id, false);
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toBe('Eliminado');
  });

  // ⚠️ Caso 2: backend activo pero GraphQL responde fallido
  it('⚠️ no debe eliminar en IndexedDB si GraphQL responde exitoso = N', async () => {
    const id = 'EVT-456';
    loadIndexDB.ping.mockReturnValue(of('pong'));
    const mockResponse: GraphQLResponse = { exitoso: 'N', mensaje: 'No se pudo eliminar' };
    graphQL.mutation.mockReturnValue(of({ deleteActividad: mockResponse }));

    const result = await service.eliminarEvento(id);

    expect(graphQL.mutation).toHaveBeenCalled();
    expect(actividadesDS.delete).not.toHaveBeenCalledWith(id, false);
    expect(result.exitoso).toBe('N');
  });

  // 📴 Caso 3: backend inactivo → eliminación offline
  it('📴 debe marcar evento como eliminado localmente cuando ping ≠ pong', async () => {
    const id = 'EVT-789';
    loadIndexDB.ping.mockReturnValue(of('offline'));

    const result = await service.eliminarEvento(id);

    expect(actividadesDS.delete).toHaveBeenCalledWith(id, true);
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toContain('satisfactoriamente');
  });

  // 🚨 Caso 4: GraphQL lanza error → debe atraparse sin romper
  it('🚨 debe capturar error del GraphQL y no romper ejecución', async () => {
    const id = 'EVT-999';
    loadIndexDB.ping.mockReturnValue(of('pong'));
    graphQL.mutation.mockReturnValue(throwError(() => new Error('Network error')));

    let result: GraphQLResponse | undefined;
    try {
      result = await service.eliminarEvento(id);
    } catch {
      result = undefined;
    }

    expect(graphQL.mutation).toHaveBeenCalled();
    expect(actividadesDS.delete).not.toHaveBeenCalledWith(id, false);
    expect(result).toBeUndefined();
  });

  // 🧪 Caso 5: validación de query enviada
  it('🧪 debe usar correctamente el query DELETE_ACTIVIDAD', async () => {
    const id = 'EVT-777';
    loadIndexDB.ping.mockReturnValue(of('pong'));
    const mockResponse: GraphQLResponse = { exitoso: 'S', mensaje: 'OK' };
    graphQL.mutation.mockReturnValue(of({ deleteActividad: mockResponse }));

    await service.eliminarEvento(id);
    const query = graphQL.mutation.mock.calls.at(-1)?.[0];

    expect(query).toContain('mutation DeleteActividad');
    expect(query).toContain('deleteActividad');
  });
});
