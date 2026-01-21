import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ExcepcionesService, Excepcion } from '../../app/excepciones/services/excepciones.services';
import { GraphQLService } from '../../app/shared/services/graphql.service';

describe('🧩 ExcepcionesService', () => {
  let service: ExcepcionesService;
  let graphQL: jest.Mocked<GraphQLService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExcepcionesService,
        {
          provide: GraphQLService,
          useValue: {
            query: jest.fn(),
            mutation: jest.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(ExcepcionesService);
    graphQL = TestBed.inject(GraphQLService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('✅ getExcepciones debe retornar lista de excepciones', async () => {
    const mockResp = {
      getExcepciones: [
        { id_excepcion: '1', error: 'E1', mensaje: 'M1', id_creado_por: '', fecha_creacion: '', id_modificado_por: '', fecha_modificacion: '' },
        { id_excepcion: '2', error: 'E2', mensaje: 'M2', id_creado_por: '', fecha_creacion: '', id_modificado_por: '', fecha_modificacion: '' },
      ],
    };
    (graphQL.query as jest.Mock).mockReturnValue(of(mockResp));
    const result = await service.getExcepciones();
    expect(graphQL.query).toHaveBeenCalled();
    expect(result.length).toBe(2);
    expect(result[0].error).toBe('E1');
  });

  it('⚠️ getExcepciones debe lanzar error si GraphQL falla', async () => {
    (graphQL.query as jest.Mock).mockImplementation(() => { throw new Error('GraphQL error'); });
    await expect(service.getExcepciones()).rejects.toThrow('GraphQL error');
  });

  it('✅ guardarCambiosExcepciones debe retornar respuesta exitosa', async () => {
    const mockResp = {
      guardarCambiosExcepciones: { exitoso: 'S', mensaje: 'OK' },
    };
    (graphQL.mutation as jest.Mock).mockReturnValue(of(mockResp));
    const payload = {
      nuevos: [{ error: 'E', mensaje: 'M' }],
      modificados: [],
      eliminados: [],
    };
    const result = await service.guardarCambiosExcepciones(payload);
    expect(graphQL.mutation).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toBe('OK');
  });

  it('⚠️ guardarCambiosExcepciones debe lanzar error si GraphQL falla', async () => {
    (graphQL.mutation as jest.Mock).mockImplementation(() => { throw new Error('GraphQL error'); });
    const payload = {
      nuevos: [],
      modificados: [],
      eliminados: [],
    };
    await expect(service.guardarCambiosExcepciones(payload)).rejects.toThrow('GraphQL error');
  });
});
