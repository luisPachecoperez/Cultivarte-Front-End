// ✅ src/tests/services/graphql.service.spec.ts (versión Jest migrada)
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { DOCUMENT } from '@angular/common';
import { CookieInterface } from '../../app/shared/interfaces/cookie-interface';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http'; // Si ya está importado, omite esta línea


describe('🧩 GraphQLService (Jest)', () => {
  let service: GraphQLService;
  let httpMock: HttpTestingController;
  let mockDocument: { cookie: string };

  const API_URL = 'http://localhost:5000/graphql';

  beforeEach(() => {
    environment.GRAPHQL_URL = API_URL; // Sobrescribe la URL real para los tests
    mockDocument = { cookie: '' };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GraphQLService,
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });

    service = TestBed.inject(GraphQLService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // -------------------------------------------------------
  // 🔹 getCookie
  // -------------------------------------------------------
  describe('getCookie', () => {
    it('✅ debe devolver el valor cuando existe', () => {
      mockDocument.cookie = 'session_auth=abc123; other=value';
      expect(service['getCookie']('session_auth')).toBe('abc123');
    });

    it('⚪ retorna string vacío si no hay valor después del igual', () => {
      mockDocument.cookie = 'session_auth=';
      expect(service['getCookie']('session_auth')).toBe('');
    });

    it('⚪ debe retornar null si no se encuentra la cookie', () => {
      mockDocument.cookie = 'other=value';
      expect(service['getCookie']('session_auth')).toBeNull();
    });

    it('⚠️ maneja URI malformados sin romper', () => {
      mockDocument.cookie = 'session_auth=%E0%A4%A';
      const result = service['getCookie']('session_auth');
      expect(result).toBe('%E0%A4%A');
    });
  });

  // -------------------------------------------------------
  // 🔹 getBearerFromCookie
  // -------------------------------------------------------
  describe('getBearerFromCookie', () => {
    it('✅ extrae token desde JSON plano', () => {
      const cookieValue = JSON.stringify({ token: 'plain-token' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe(
        'plain-token',
      );
    });
    it('⚪ retorna null si el JSON base64 no tiene token, access_token ni jwt', () => {
      const obj: CookieInterface = { otro: 'valor' } as any;
      const base64 = btoa(JSON.stringify(obj));
      mockDocument.cookie = `session_auth=${base64}`;
      expect(service['getBearerFromCookie']('session_auth')).toBeNull();
    });

    it('✅ retorna access_token si solo existe access_token', () => {
      const cookieValue = JSON.stringify({ access_token: 'accesstoken-123' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('accesstoken-123');
    });

    it('⚪ retorna null si no hay token, access_token ni jwt', () => {
      const cookieValue = JSON.stringify({ otro: 'valor' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBeNull();
    });

    it('✅ extrae access_token desde JSON base64', () => {
      const obj: CookieInterface = { access_token: 'base64-access' } as any;
      const base64 = btoa(JSON.stringify(obj));
      mockDocument.cookie = `session_auth=${base64}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('base64-access');
    });

    it('✅ extrae jwt desde JSON base64', () => {
      const obj: CookieInterface = { jwt: 'base64-jwt' } as any;
      const base64 = btoa(JSON.stringify(obj));
      mockDocument.cookie = `session_auth=${base64}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('base64-jwt');
    });

    it('✅ extrae access_token desde JSON', () => {
      const cookieValue = JSON.stringify({ access_token: 'access-456' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('access-456');
    });

    it('✅ extrae jwt desde JSON', () => {
      const cookieValue = JSON.stringify({ jwt: 'jwt-789' });
      mockDocument.cookie = `session_auth=${cookieValue}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe('jwt-789');
    });

    it('✅ extrae token desde JSON codificado en base64', () => {
      const obj: CookieInterface = { token: 'base64-token' } as any;
      const base64 = btoa(JSON.stringify(obj));
      mockDocument.cookie = `session_auth=${base64}`;
      expect(service['getBearerFromCookie']('session_auth')).toBe(
        'base64-token',
      );
    });

    it('⚪ retorna valor crudo si no es JSON ni base64', () => {
      mockDocument.cookie = 'session_auth=raw-token';
      expect(service['getBearerFromCookie']('session_auth')).toBe('raw-token');
    });

    it('⚪ retorna null si no existe la cookie', () => {
      mockDocument.cookie = '';
      expect(service['getBearerFromCookie']('session_auth')).toBeNull();
    });
  });

  // -------------------------------------------------------
  // 🔹 authHeaders
  // -------------------------------------------------------
  describe('authHeaders', () => {
    it('⚪ no incluye Authorization cuando no hay token', () => {
      mockDocument.cookie = '';
      const headers = service['authHeaders']();
      expect(headers.get('Authorization')).toBeNull();
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  // -------------------------------------------------------
  // 🔹 query
  // -------------------------------------------------------
  describe('query', () => {

  });

  // -------------------------------------------------------
  // 🔹 mutation
  // -------------------------------------------------------
  describe('mutation', () => {

  });

  // -------------------------------------------------------
  // 🔹 Ramas no cubiertas (try/catch de getCookie y getBearerFromCookie)
  // -------------------------------------------------------
  describe('Branch coverage (try/catch edge cases)', () => {
    it('⚠️ getCookie entra al catch cuando decodeURIComponent lanza error', () => {
      // Valor malformado que hace fallar decodeURIComponent
      mockDocument.cookie = 'session_auth=%E0%A4%A'; // secuencia UTF-8 inválida
      const result = service['getCookie']('session_auth');
      // debe devolver la parte cruda sin romper
      expect(result).toBe('%E0%A4%A');
    });

    it('⚠️ getBearerFromCookie entra al catch del JSON.parse', () => {
      // Valor que no es JSON, pero tampoco base64 válido
      mockDocument.cookie = 'session_auth={bad-json}';
      const result = service['getBearerFromCookie']('session_auth');
      // debería retornar el valor crudo
      expect(result).toBe('{bad-json}');
    });

    it('⚠️ getBearerFromCookie entra al catch del base64->JSON', () => {
      // Valor que hace fallar atob() directamente
      const invalidBase64 = '###@@@'; // ❌ no es base64 válido
      mockDocument.cookie = `session_auth=${invalidBase64}`;
      const result = service['getBearerFromCookie']('session_auth');
      // al fallar atob, retorna el valor crudo
      expect(result).toBe(invalidBase64);
    });
  });
  //qwen
  it('⚪ maneja document.cookie undefined', () => {
    mockDocument.cookie = undefined as any;
    expect(service['getCookie']('session_auth')).toBeNull();
  });
  it('⚠️ usa valor crudo cuando decodeURIComponent falla', () => {
    // Simulamos un valor que lanza error en decodeURIComponent
    const invalidURIComponent = '%E0%A4%A'; // URI malformado
    mockDocument.cookie = `session_auth=${invalidURIComponent}`;

    const result = service['getCookie']('session_auth');
    expect(result).toBe(invalidURIComponent); // No se decodifica, se devuelve tal cual
  });
  it('⚠️ usa valor crudo cuando globalThis.atob no está disponible', () => {
    // Simulamos un entorno sin atob
    const originalAtob = (globalThis as any).atob;
    (globalThis as any).atob = undefined;

    try {
      const rawValue = 'not-base64';
      mockDocument.cookie = `session_auth=${rawValue}`;
      const result = service['getBearerFromCookie']('session_auth');
      expect(result).toBe(rawValue);
    } finally {
      (globalThis as any).atob = originalAtob; // restauramos
    }
  });

  //deepseek
  it('❌ debe manejar error en decodeURIComponent y retornar valor crudo', () => {
    // Simular un valor que cause error en decodeURIComponent
    mockDocument.cookie = 'session_auth=%E0%A4%A'; // Secuencia UTF-8 inválida

    // Mock decodeURIComponent para que lance error
    const originalDecode = global.decodeURIComponent;
    global.decodeURIComponent = jest.fn(() => {
      throw new URIError('Malformed URI');
    });

    const result = service['getCookie']('session_auth');

    // Debe retornar el valor crudo sin decodificar
    expect(result).toBe('%E0%A4%A');

    // Restaurar implementación original
    global.decodeURIComponent = originalDecode;
  });
  it('❌ debe manejar JSON parse error en el primer intento', () => {
    // JSON inválido
    mockDocument.cookie = 'session_auth={invalid json';

    const result = service['getBearerFromCookie']('session_auth');

    // Debe retornar el valor crudo
    expect(result).toBe('{invalid json');
  });
  it('❌ debe manejar base64 decode error en el segundo intento', () => {
    // String que no es base64 válido
    mockDocument.cookie = 'session_auth=not-base64-valid';

    const result = service['getBearerFromCookie']('session_auth');

    // Debe retornar el valor crudo
    expect(result).toBe('not-base64-valid');
  });
  it('⚪ debe retornar null cuando JSON parseado no tiene token, access_token ni jwt', () => {
    const cookieValue = JSON.stringify({ other_field: 'value' });
    mockDocument.cookie = `session_auth=${cookieValue}`;

    const result = service['getBearerFromCookie']('session_auth');

    expect(result).toBeNull();
  });

  it('⚪ debe retornar null cuando base64 decode retorna string vacío', () => {
    const emptyBase64 = btoa('');
    mockDocument.cookie = `session_auth=${emptyBase64}`;

    const result = service['getBearerFromCookie']('session_auth');

    expect(result).toBeNull();
  });

  it('✅ authHeaders incluye Authorization cuando hay token', () => {
  // Mock getBearerFromCookie para retornar un token
  jest.spyOn<any, any>(service, 'getBearerFromCookie').mockReturnValue('test-token');

  const headers = (service as any).authHeaders();
  expect(headers.get('Authorization')).toBe('Bearer test-token');
  expect(headers.get('Content-Type')).toBe('application/json');
});

it('✅ authHeaders NO incluye Authorization cuando no hay token', () => {
  jest.spyOn<any, any>(service, 'getBearerFromCookie').mockReturnValue(null);

  const headers = (service as any).authHeaders();
  expect(headers.get('Authorization')).toBeNull();
  expect(headers.get('Content-Type')).toBe('application/json');
});

  it('⚪ no incluye Authorization cuando getBearerFromCookie retorna null', () => {
    // Mock getBearerFromCookie para retornar null
    jest.spyOn(service as any, 'getBearerFromCookie').mockReturnValue(null);

    const headers = service['authHeaders']();

    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('Content-Type')).toBe('application/json');
  });
  it('⚪ no incluye Authorization cuando getBearerFromCookie retorna string vacío', () => {
    // Mock getBearerFromCookie para retornar string vacío
    jest.spyOn(service as any, 'getBearerFromCookie').mockReturnValue('');

    const headers = service['authHeaders']();

    expect(headers.get('Authorization')).toBeNull();
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  //chat
});
