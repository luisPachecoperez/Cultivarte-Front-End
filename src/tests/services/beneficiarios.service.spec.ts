import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BeneficiariosService } from '../../app/beneficiarios/registro/services/beneficiarios.service';
import { GraphQLService } from '../../app/shared/services/graphql.service';

describe('🧩 BeneficiariosService', () => {
  let service: BeneficiariosService;
  let graphQL: jest.Mocked<GraphQLService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BeneficiariosService,
        {
          provide: GraphQLService,
          useValue: {
            query: jest.fn(),
            mutation: jest.fn(),
          },
        },
      ],
    });
    service = TestBed.inject(BeneficiariosService);
    graphQL = TestBed.inject(GraphQLService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('✅ getPreBeneficiarios debe retornar datos correctamente', async () => {
    const mockResp = {
      getPreBeneficiarios: {
        id_programa: 'P1',
        id_grupo_interes: 'G1',
        sedes: [{ id_sede: '1', nombre: 'Sede 1' }],
        tiposIdentificacion: [],
        tiposPersona: [],
        sexo: [],
        ubicaciones: [],
      },
    };
    (graphQL.query as jest.Mock).mockReturnValue(of(mockResp));
    const result = await service.getPreBeneficiarios('user1');
    expect(graphQL.query).toHaveBeenCalled();
    expect(result[0].id_programa).toBe('P1');
    expect(result[0].sedes.length).toBe(1);
  });

  it('✅ getPersonasParams debe retornar lista de personas', async () => {
    const mockResp = {
      getPersonasParams: [
        { id_persona: '1', nombres: 'Ana', apellidos: 'Pérez' },
        { id_persona: '2', nombres: 'Luis', apellidos: 'Díaz' },
      ],
    };
    (graphQL.query as jest.Mock).mockReturnValue(of(mockResp));
    const result = await service.getPersonasParams('1', 'P1', 'G1', 10, 0);
    expect(graphQL.query).toHaveBeenCalled();
    expect(result.length).toBe(2);
    expect(result[0].nombres).toBe('Ana');
  });

  it('🧪 getPersonasParams() debe enviar limit=50 por defecto si no se especifica', async () => {
    const mockResp = {
      getPersonasParams: [
        { id_persona: '1', nombres: 'Ana', apellidos: 'Pérez' },
        { id_persona: '2', nombres: 'Luis', apellidos: 'Díaz' },
      ],
    };
    (graphQL.query as jest.Mock).mockReturnValue(of(mockResp));
    await service.getPersonasParams('1', 'P1', 'G1');
    // Verifica que el parámetro limit sea 50
    const callArgs = (graphQL.query as jest.Mock).mock.calls[0][1];
    expect(callArgs.limit).toBe(50);
    expect(callArgs.offset).toBe(0);
    expect(callArgs.id_sede).toBe('1');
    expect(callArgs.id_programa).toBe('P1');
    expect(callArgs.id_grupo_interes).toBe('G1');
  });

  it('✅ guardarCambiosBeneficiarios debe retornar respuesta del backend', async () => {
    const mockResp = {
      updateBeneficiarios: { exitoso: 'S', mensaje: 'OK' },
    };
    (graphQL.mutation as jest.Mock).mockReturnValue(of(mockResp));
    const payload = {
      id_programa: 'P1',
      id_grupo_interes: 'G1',
      nuevos: [],
      modificados: [],
      eliminados: [],
    };
    const result = await service.guardarCambiosBeneficiarios(payload);
    expect(graphQL.mutation).toHaveBeenCalled();
    expect(result.exitoso).toBe('S');
    expect(result.mensaje).toBe('OK');
  });

  it('⚠️ getPreBeneficiarios debe lanzar error si GraphQL falla', async () => {
    (graphQL.query as jest.Mock).mockImplementation(() => {
      throw new Error('GraphQL error');
    });
    await expect(service.getPreBeneficiarios('user1')).rejects.toThrow('GraphQL error');
  });

  it('⚠️ getPersonasParams debe lanzar error si GraphQL falla', async () => {
    (graphQL.query as jest.Mock).mockImplementation(() => {
      throw new Error('GraphQL error');
    });
    await expect(
      service.getPersonasParams('1', 'P1', 'G1', 10, 0),
    ).rejects.toThrow('GraphQL error');
  });

  it('⚠️ guardarCambiosBeneficiarios debe lanzar error si GraphQL falla', async () => {
    (graphQL.mutation as jest.Mock).mockImplementation(() => {
      throw new Error('GraphQL error');
    });
    const payload = {
      id_programa: 'P1',
      id_grupo_interes: 'G1',
      nuevos: [],
      modificados: [],
      eliminados: [],
    };
    await expect(service.guardarCambiosBeneficiarios(payload)).rejects.toThrow('GraphQL error');
  });
});
