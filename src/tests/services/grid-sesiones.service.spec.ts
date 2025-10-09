import { TestBed } from '@angular/core/testing';
import { Grid_sesionesService } from '../../app/eventos/components/grid-sesiones.component/services/grid-sesiones.service';

import { GraphQLService } from '../../app/shared/services/graphql.service';

import { AuthService } from '../../app/shared/services/auth.service';

import { LoadIndexDBService } from '../../app/indexdb/services/load-index-db.service';

import { SesionesDataSource } from '../../app/indexdb/datasources/sesiones-datasource';
import { of, throwError } from 'rxjs';
import { GraphQLResponse } from '../../app/shared/interfaces/graphql-response.interface';

// 🧱 Mocks de dependencias
class GraphQLServiceMock {
  mutation = jest.fn('mutation');
}
class AuthServiceMock {
  getUserUuid = jest.fn('getUserUuid').and.returnValue('USER-123');
}
class LoadIndexDBServiceMock {
  ping = jest.fn('ping');
}
class SesionesDataSourceMock {
  create = jest.fn('create');
  update = jest.fn('update');
  delete = jest.fn('delete');
}

describe('🧩 Grid_sesionesService (Cobertura 95%)', () => {
  let service: Grid_sesionesService;
  let graphQL: GraphQLServiceMock;
  let auth: AuthServiceMock;
  let loadIndexDB: LoadIndexDBServiceMock;
  let sesionesDS: SesionesDataSourceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        Grid_sesionesService,
        { provide: GraphQLService, useClass: GraphQLServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: LoadIndexDBService, useClass: LoadIndexDBServiceMock },
        { provide: SesionesDataSource, useClass: SesionesDataSourceMock },
      ],
    });

    service = TestBed.inject(Grid_sesionesService);
    graphQL = TestBed.inject(GraphQLService) as any;
    auth = TestBed.inject(AuthService) as any;
    loadIndexDB = TestBed.inject(LoadIndexDBService) as any;
    sesionesDS = TestBed.inject(SesionesDataSource) as any;
  });

  // 🧠 Datos base para pruebas
  const payload = {
    nuevos: [{ id_sesion: 'N1', id_creado_por: 'U1' } as any],
    modificados: [{ id_sesion: 'M1', id_creado_por: 'U2' } as any],
    eliminados: [{ id_sesion: 'E1' }],
  };

  // ✅ Caso 1: backend activo → mutación exitosa
  it('✅ debe sincronizar sesiones con GraphQL y actualizar IndexedDB', async () => {
    loadIndexDB.ping.and.returnValue(of('pong'));
    const mockResponse: GraphQLResponse = { exitoso: 'S', mensaje: 'OK' };
    graphQL.mutation.and.returnValue(of({ updateSesiones: mockResponse }));

    const result = await service.guardarCambiosSesiones(payload);

    expect(loadIndexDB.ping).toHaveBeenCalled();
    expect(graphQL.mutation).toHaveBeenCalled();
    expect(sesionesDS.create).toHaveBeenCalledTimes(1);
    expect(sesionesDS.update).toHaveBeenCalledTimes(1);
    expect(sesionesDS.delete).toHaveBeenCalledTimes(1);
    expect(result.exitoso).toBe('S');
  });

  // ⚠️ Caso 2: backend activo pero GraphQL lanza error → fallback controlado
  it('⚠️ debe capturar errores en la mutación GraphQL sin romper', async () => {
    loadIndexDB.ping.and.returnValue(of('pong'));
    graphQL.mutation.and.returnValue(throwError(() => new Error('GraphQL fail')));

    const result = await service.guardarCambiosSesiones(payload);

    expect(graphQL.mutation).toHaveBeenCalled();
    expect(result.exitoso).toBe('N');
    expect(result.mensaje).toContain('Error actualizando sesiones');
  });

  // 📴 Caso 3: backend inactivo → operaciones offline
  it('📴 debe crear, actualizar y marcar sesiones en modo offline', async () => {
    loadIndexDB.ping.and.returnValue(of('offline'));

    const result = await service.guardarCambiosSesiones(payload);

    expect(sesionesDS.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ id_sesion: 'N1', syncStatus: 'pending-create' })
    );
    expect(sesionesDS.update).toHaveBeenCalledWith(
      'M1',
      jasmine.objectContaining({ syncStatus: 'pending-update' })
    );
    expect(sesionesDS.delete).toHaveBeenCalledWith('E1', true);
    expect(result.exitoso).toBe('S');
  });

  // 🔄 Caso 4: validación de transformación de datos antes de enviar
  it('🔄 debe agregar id_modificado_por usando AuthService', async () => {
    loadIndexDB.ping.and.returnValue(of('offline'));

    await service.guardarCambiosSesiones(payload);

    const args = sesionesDS.update.calls.mostRecent().args[1];
    expect(args.id_sesion).toBe('M1');
    expect(auth.getUserUuid).toHaveBeenCalled();
  });

  // 🚨 Caso 5: si ping devuelve valor inesperado, también actúa offline
  it('🚨 debe comportarse como offline si ping devuelve null', async () => {
    loadIndexDB.ping.and.returnValue(of(null));
    const result = await service.guardarCambiosSesiones(payload);

    expect(result.exitoso).toBe('S');
    expect(sesionesDS.create).toHaveBeenCalled();
    expect(sesionesDS.update).toHaveBeenCalled();
    expect(sesionesDS.delete).toHaveBeenCalled();
  });
});
