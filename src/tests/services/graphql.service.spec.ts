// ✅ src/tests/services/graphql.service.spec.ts (versión Jest migrada)
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GraphQLService } from '../../app/shared/services/graphql.service';
import { DOCUMENT } from '@angular/common';
import { CookieInterface } from '../../app/shared/interfaces/cookie-interface';

describe('🧩 GraphQLService (Jest)', () => {
  let service: GraphQLService;
  let httpMock: HttpTestingController;
  let mockDocument: { cookie: string };

  const API_URL = 'http://localhost:5000/graphql';

  beforeEach(() => {
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
      expect(service['getBearerFromCookie']('session_auth')).toBe('plain-token');
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
      expect(service['getBearerFromCookie']('session_auth')).toBe('base64-token');
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
    it('✅ incluye Authorization cuando hay token', () => {
      mockDocument.cookie = 'session_auth=direct-token';
      const headers = service['authHeaders']();
      expect(headers.get('Authorization')).toBe('Bearer direct-token');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

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
    it('✅ envía POST correcto y devuelve datos', () => {
      const query = '{ me { id } }';
      const variables = { input: 'test' };
      const mockResponse = { data: { me: { id: '1' } } };

      service.query<{ me: { id: string } }>(query, variables).subscribe((res) => {
        expect(res).toEqual(mockResponse.data);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');

      const body = JSON.parse(req.request.body as string);
      expect(body).toEqual({ query, variables });
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush(mockResponse);
    });

    it('🔴 maneja error HTTP y relanza objeto custom', (done) => {
      const query = '{ me { id } }';

      service.query(query).subscribe({
        error: (err) => {
          expect(err).toEqual({
            exitoso: 'N',
            mensaje: expect.any(Error),
          });
          done();
        },
      });

      const req = httpMock.expectOne(API_URL);
      req.flush('GraphQL error', { status: 400, statusText: 'Bad Request' });
    });
  });

  // -------------------------------------------------------
  // 🔹 mutation
  // -------------------------------------------------------
  describe('mutation', () => {
    it('✅ envía mutation correctamente y devuelve datos', () => {
      const mutation = 'mutation Login($email: String!) { login(email: $email) { token } }';
      const variables = { email: 'test@example.com' };
      const mockResponse = { data: { login: { token: 'xyz' } } };

      service.mutation<{ login: { token: string } }>(mutation, variables).subscribe((res) => {
        expect(res).toEqual(mockResponse.data);
      });

      const req = httpMock.expectOne(API_URL);
      expect(req.request.method).toBe('POST');
      const body = JSON.parse(req.request.body as string);
      expect(body).toEqual({ query: mutation, variables });

      req.flush(mockResponse);
    });

    it('✅ incluye Authorization si existe token', () => {
      mockDocument.cookie = 'session_auth=mut-token';
      const mutation = 'mutation { logout }';
      const mockResponse = { data: { logout: true } };

      service.mutation(mutation).subscribe();

      const req = httpMock.expectOne(API_URL);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mut-token');
      req.flush(mockResponse);
    });

    it('🔴 maneja error en mutation correctamente', (done) => {
      const mutation = 'mutation { invalid }';

      service.mutation(mutation).subscribe({
        error: (err) => {
          expect(err).toEqual({
            exitoso: 'N',
            mensaje: expect.any(Error),
          });
          done();
        },
      });

      const req = httpMock.expectOne(API_URL);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
